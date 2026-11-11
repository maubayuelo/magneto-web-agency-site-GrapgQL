/// <reference types="vitest" />
import { lockPageScroll } from './scroll-lock';

describe('lockPageScroll', () => {
  const html = document.documentElement;
  const body = document.body;
  let scrollTo: ReturnType<typeof vi.spyOn>;

  const setScroll = (x: number, y: number) => {
    Object.defineProperty(window, 'scrollX', { configurable: true, value: x });
    Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
  };

  beforeEach(() => {
    scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    html.removeAttribute('style');
    body.removeAttribute('style');
    setScroll(0, 0);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    html.removeAttribute('style');
    body.removeAttribute('style');
    setScroll(0, 0);
  });

  it('pins the body at the current offset and hides overflow', () => {
    setScroll(10, 420);
    const unlock = lockPageScroll();
    expect(html.style.overflow).toBe('hidden');
    expect(body.style.position).toBe('fixed');
    expect(body.style.top).toBe('-420px');
    expect(body.style.left).toBe('0px');
    expect(body.style.right).toBe('0px');
    expect(body.style.overflow).toBe('hidden');
    unlock();
  });

  it('unlock removes the style attributes when there were none, and restores the scroll position', () => {
    setScroll(10, 420);
    const unlock = lockPageScroll();
    unlock();
    expect(html.hasAttribute('style')).toBe(false);
    expect(body.hasAttribute('style')).toBe(false);
    expect(scrollTo).toHaveBeenCalledWith(10, 420);
  });

  it('unlock restores pre-existing inline styles exactly', () => {
    html.setAttribute('style', 'scroll-behavior: smooth;');
    body.setAttribute('style', 'color: red; overflow: auto;');
    const unlock = lockPageScroll();
    expect(body.style.overflow).toBe('hidden');
    unlock();
    expect(html.getAttribute('style')).toBe('scroll-behavior: smooth;');
    expect(body.getAttribute('style')).toBe('color: red; overflow: auto;');
  });

  it('pads the body by the scrollbar width when there is one', () => {
    const clientWidth = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth')!;
    Object.defineProperty(html, 'clientWidth', { configurable: true, value: window.innerWidth - 15 });
    try {
      const unlock = lockPageScroll();
      expect(body.style.paddingRight).toBe('15px');
      unlock();
      expect(body.hasAttribute('style')).toBe(false);
    } finally {
      delete (html as unknown as { clientWidth?: number }).clientWidth;
      expect(Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth')).toEqual(clientWidth);
    }
  });
});
