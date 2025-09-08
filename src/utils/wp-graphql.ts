const WP_GRAPHQL_URL = "https://magneto-cms.local/graphql";

export async function fetchWPGraphQL(query: string, variables: Record<string, any> = {}) {
  const res = await fetch(WP_GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 60 }, // ISR, optional
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}