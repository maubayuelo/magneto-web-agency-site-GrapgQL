// Server-side utilities for interacting with Brevo (Sendinblue)
// Keep secrets in process.env.BREVO_API_KEY

export interface BrevoContactPayload {
  email: string;
  attributes?: Record<string, string>;
  listIds?: number[];
  updateEnabled?: boolean; // if true, update existing contact
}

export async function createBrevoContact(payload: BrevoContactPayload) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('Missing BREVO_API_KEY');

  const body: any = { email: payload.email };
  if (payload.attributes) body.attributes = payload.attributes;
  if (payload.listIds) body.listIds = payload.listIds;
  if (typeof payload.updateEnabled !== 'undefined') body.updateEnabled = !!payload.updateEnabled;

  const res = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data?.message || `Brevo API error: ${res.status}`;
    const err: any = new Error(message);
    err.data = data;
    throw err;
  }

  return data;
}

export default { createBrevoContact };
