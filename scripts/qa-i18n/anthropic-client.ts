// The ONLY file that imports @anthropic-ai/sdk (ADR 0009). Loaded with a dynamic import() only in --llm mode.
// SDK 1.6.0, verified 2026-11-09 against platform.claude.com/docs (structured outputs, errors, client config).
// Mechanism: structured outputs (`output_config.format`, json_schema): Mauricio's decision, 2026-11-09. Forced
// tool_choice returns a 400 on claude-opus-5-5, so D-3 option A could not be used.
import Anthropic from '@anthropic-ai/sdk';
import type { LlmClient, LlmRequest, LlmResponse } from './llm.ts';

/** SDK retries 408/409/429/5xx and connection errors with exponential backoff (0.5 s doubling, max 8 s). */
const MAX_RETRIES = 3;
const TIMEOUT_MS = 60_000;

/** Errors reduced to status, type, request_id and message: never the request, headers or key (§4.6). */
export class SanitizedApiError extends Error {}

function sanitize(err: unknown, apiKey: string): SanitizedApiError {
  const redact = (s: string) => (apiKey ? s.split(apiKey).join('[redacted]') : s);
  if (err instanceof Anthropic.APIError) {
    const parts = [`status ${err.status ?? 'none'}`, `type ${err.type ?? 'unknown'}`, `request_id ${err.requestID ?? 'none'}`, err.apiMessage ?? err.message];
    return new SanitizedApiError(redact(`Anthropic API error: ${parts.join(' · ')}`));
  }
  return new SanitizedApiError(redact(`Anthropic client error: ${err instanceof Error ? err.message : String(err)}`));
}

export function createAnthropicClient(apiKey: string): LlmClient {
  const client = new Anthropic({ apiKey, maxRetries: MAX_RETRIES, timeout: TIMEOUT_MS });
  return {
    async review(req: LlmRequest): Promise<LlmResponse> {
      let res: Anthropic.Message & { _request_id?: string | null }; // the SDK adds _request_id to responses
      try {
        res = await client.messages.create({
          model: req.model,
          max_tokens: req.maxOutputTokens,
          system: req.system,
          messages: [{ role: 'user', content: req.user }],
          output_config: { format: { type: 'json_schema', schema: req.outputSchema } },
        });
      } catch (err) {
        throw sanitize(err, apiKey);
      }
      const text = res.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
      let output: unknown;
      try {
        output = JSON.parse(text);
      } catch {
        output = undefined;
      }
      return {
        output,
        stopReason: res.stop_reason ?? 'unknown',
        requestId: res._request_id ?? undefined,
        usage: {
          inputTokens: res.usage.input_tokens,
          outputTokens: res.usage.output_tokens,
          cacheCreationInputTokens: res.usage.cache_creation_input_tokens ?? 0,
          cacheReadInputTokens: res.usage.cache_read_input_tokens ?? 0,
        },
      };
    },
  };
}
