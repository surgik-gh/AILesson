// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfills for Node.js environment
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Add fetch polyfill for Node.js environment
// Using node-fetch or undici for fetch support
if (typeof global.fetch === 'undefined') {
  global.fetch = async (...args) => {
    const nodeFetch = (await import('node-fetch')).default;
    return nodeFetch(...args);
  };
}

// Mock window.matchMedia for responsive and 3D components (only in jsdom environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}
