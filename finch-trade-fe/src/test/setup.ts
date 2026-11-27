import '@testing-library/jest-dom/vitest';

Object.defineProperty(window, 'scrollTo', { value: () => {} });
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: () => {},
});
