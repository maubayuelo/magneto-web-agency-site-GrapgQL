// Setup DOM globals and polyfills for tests
/// <reference types="vitest" />
/// <reference types="vite/client" />
import '@testing-library/jest-dom';
import 'whatwg-fetch';

// Provide a global gtag mock helper if tests want it
beforeEach(() => {
  // @ts-ignore
  window.gtag = window.gtag || ((...args: any[]) => {
    // store last event for test assertions
    // @ts-ignore
    window.__lastGtagEvent = args;
  });
});

afterEach(() => {
  // @ts-ignore
  window.__lastGtagEvent = undefined;
});
