/**
 * Locks page scroll while a modal is open and returns the unlock function.
 * iOS Safari still scrolls the page behind a modal <dialog> and ignores `overflow: hidden` on <body> for touch
 * scrolling, so the body is pinned with `position: fixed` at the current offset. Unlock restores the exact inline
 * styles and the scroll position. The padding stands in for the desktop scrollbar so the page doesn't shift.
 */
export function lockPageScroll(): () => void {
  const html = document.documentElement;
  const body = document.body;
  const x = window.scrollX;
  const y = window.scrollY;
  const scrollbar = window.innerWidth - html.clientWidth;
  const prevHtml = html.getAttribute('style');
  const prevBody = body.getAttribute('style');

  html.style.overflow = 'hidden';
  body.style.position = 'fixed';
  body.style.top = `${-y}px`;
  body.style.left = '0';
  body.style.right = '0';
  body.style.overflow = 'hidden';
  if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

  return () => {
    const restore = (el: HTMLElement, prev: string | null) =>
      prev === null ? el.removeAttribute('style') : el.setAttribute('style', prev);
    restore(html, prevHtml);
    restore(body, prevBody);
    window.scrollTo(x, y);
  };
}
