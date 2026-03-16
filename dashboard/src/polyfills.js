// Polyfill for undici private field syntax issue
// This file should be imported before any Firebase imports

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  // Polyfill for private fields if not supported
  if (!window.WeakMap) {
    window.WeakMap = Map;
  }
  
  // Ensure global is defined
  if (typeof global === 'undefined') {
    window.global = window;
  }
  
  // Polyfill for Node.js modules in browser
  if (!window.process) {
    window.process = {
      env: {},
      nextTick: (fn) => setTimeout(fn, 0),
      version: 'v18.0.0'
    };
  }
  
  // Mock undici if it's causing issues
  if (typeof window.fetch === 'undefined') {
    // Use native fetch or a polyfill
    window.fetch = window.fetch || (() => {
      throw new Error('Fetch not available');
    });
  }
}

export {};