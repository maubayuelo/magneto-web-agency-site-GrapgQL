import { notFound } from 'next/navigation';

// Catches /carte, /en/x (rewritten to /en/en/x), disabled /fr/x and unknown paths so they render
// the 404 inside [locale]/layout.tsx, with the header and footer, as before.
export default function CatchAllNotFound() {
  notFound();
}
