// Example: CORRECT generation
const secureKey = new Uint8Array(32);
crypto.getRandomValues(secureKey);

// Example: Clear sensitive data
const tempKey = new Uint8Array(32);
crypto.getRandomValues(tempKey);
// ... use key ...
// Clear when done:
tempKey.fill(0);
