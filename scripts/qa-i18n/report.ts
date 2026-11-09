// Report writers (spec §5). Writes exactly report.json + report.md into a directory outside the repo.
import { existsSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ConfigError, REPO_ROOT } from './inputs.ts';
import { ReportSchema, SEVERITY_RANK, type Finding, type Report } from './schema.ts';

export const FLAGS_ONLY = 'Flags only. This tool changed no text. Mauricio decides every fix.';

export const DEFAULT_OUT_ROOT = path.join(os.homedir(), 'Documents/projects/magneto/qa/i18n');

export function timestamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/** Real path of `dir`, resolving the nearest existing ancestor (the directory may not exist yet). */
function realish(dir: string): string {
  let cur = path.resolve(dir);
  const rest: string[] = [];
  while (!existsSync(cur)) {
    rest.unshift(path.basename(cur));
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return path.join(realpathSync(cur), ...rest);
}

/** Refuses (ConfigError → exit 2) any output directory inside the repository (D-6). */
export function guardOutDir(dir: string, repoRoot = REPO_ROOT): string {
  const out = realish(dir);
  const root = realpathSync(repoRoot);
  if (out === root || out.startsWith(root + path.sep)) throw new ConfigError(`--out must be outside the repository (${root}); got ${out}`);
  return out;
}

const esc = (s: string) => s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ↵ ');

function where(f: Finding): string {
  const l = f.location;
  const file = l.file[f.lang] ?? l.file.en ?? Object.values(l.file)[0] ?? '';
  const parts = [file];
  if (l.post) parts.push(l.post);
  if (l.field) parts.push(l.field + (l.row !== undefined ? `[${l.row}]` : '') + (l.subKey ? `.${l.subKey.split('.').pop()}` : ''));
  if (l.dictKey) parts.push(l.dictKey);
  if (l.section) parts.push(l.section);
  const lines = l.lines?.[f.lang];
  if (lines) parts.push(`lines ${lines[0]}-${lines[1]}`);
  return parts.join(' · ');
}

const countTable = (title: string, counts: Record<string, number>) =>
  [`| ${title} | count |`, '|---|---:|', ...Object.entries(counts).sort().map(([k, v]) => `| ${k} | ${v} |`)].join('\n');

export function renderMarkdown(report: Report, costLine: string): string {
  const lines: string[] = [FLAGS_ONLY, ''];
  lines.push(`Run ${report.runId} · commit ${report.gitCommit} · mode ${report.mode} · model ${report.options.model ?? 'n/a'} · fail-on ${report.options.failOn}`);
  lines.push(`Cost: ${costLine}`);
  if (report.incomplete) lines.push('', '**Incomplete run** (a batch failed or a cap was reached).');
  lines.push('', '## Summary', '', `Units: ${report.summary.units} · findings: ${report.findings.length}`, '');
  lines.push(countTable('severity', report.summary.bySeverity), '', countTable('check', report.summary.byCheck), '', countTable('language', report.summary.byLang), '');
  if (report.lengthSelectors) {
    lines.push(`Length selectors used: ${report.lengthSelectors.used.join(', ') || 'none'} · unused: ${report.lengthSelectors.unused.join(', ') || 'none'}`, '');
  }
  const langs = [...new Set(report.findings.map((f) => f.lang))].sort();
  for (const lang of langs) {
    lines.push(`## ${lang.toUpperCase()}`, '');
    const inLang = report.findings.filter((f) => f.lang === lang);
    for (const source of [...new Set(inLang.map((f) => f.unitId.split(':')[0]))].sort()) {
      lines.push(`### ${source}`, '');
      const list = inLang.filter((f) => f.unitId.split(':')[0] === source)
        .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || a.unitId.localeCompare(b.unitId));
      lines.push('| severity | location | check | EN excerpt | target excerpt | reason |', '|---|---|---|---|---|---|');
      for (const f of list) {
        const mark = f.check === 'length' && f.evidence.reason.endsWith('(placeholder limit)') ? ' (placeholder limit)' : '';
        lines.push(`| ${f.severity} | ${esc(where(f))} | [${f.layer === 'llm' ? 'llm' : 'det'}] ${f.check}${mark} | ${esc(f.evidence.en)} | ${esc(f.evidence.target)} | ${esc(f.evidence.reason)} |`);
      }
      lines.push('');
    }
  }
  const b = report.summary.batches;
  lines.push('## Run integrity', '', `Batches: ok ${b.ok} · failed ${b.failed} · skipped (cap) ${b.skippedCap} · rejected LLM findings ${report.rejectedLlmFindings.length} · duplicates dropped ${report.duplicatesDropped}`);
  const bad = report.batches.filter((x) => x.status !== 'ok');
  if (bad.length) lines.push('', ...bad.map((x) => `- ${x.id}: ${x.status}${x.note ? ` (${x.note})` : ''}`));
  if (report.rejectedLlmFindings.length) {
    const reasons: Record<string, number> = {};
    report.rejectedLlmFindings.forEach((r) => (reasons[r.reason.split(':')[0]] = (reasons[r.reason.split(':')[0]] ?? 0) + 1));
    lines.push('', `Rejected by reason: ${Object.entries(reasons).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  }
  return `${lines.join('\n')}\n`;
}

/** Validates the report against its own schema, then writes the two files. Returns false if the schema check fails. */
export function writeReport(outDir: string, report: Report, costLine: string, redact: (s: string) => string): { ok: boolean; files: string[]; error?: string } {
  const check = ReportSchema.safeParse(report);
  const dir = guardOutDir(outDir);
  mkdirSync(dir, { recursive: true });
  const json = path.join(dir, 'report.json');
  const md = path.join(dir, 'report.md');
  writeFileSync(json, redact(`${JSON.stringify(report, null, 2)}\n`));
  writeFileSync(md, redact(renderMarkdown(report, costLine)));
  return check.success ? { ok: true, files: [json, md] } : { ok: false, files: [json, md], error: check.error.issues.slice(0, 5).map((i) => `${i.path.join('.')} ${i.message}`).join('; ') };
}
