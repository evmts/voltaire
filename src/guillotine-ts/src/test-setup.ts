// Test setup file for Jest
// This file is run before each test file

// Global test timeout
jest.setTimeout(30000);

// Mock console methods if needed
global.console = {
  ...console,
  // Uncomment if you want to suppress logs during tests
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Mock fetch for browser-like environment testing
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn();
}

// Mock WebAssembly if not available in test environment
if (typeof global.WebAssembly === 'undefined') {
  global.WebAssembly = {
    instantiate: jest.fn(),
    compile: jest.fn(),
    Memory: jest.fn(),
    Table: jest.fn(),
    Module: jest.fn(),
    Instance: jest.fn(),
  } as unknown as typeof WebAssembly;
}