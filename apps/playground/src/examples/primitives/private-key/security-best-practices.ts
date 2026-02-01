// Example: CORRECT generation
const secureKey = Bytes32.zero();
crypto.getRandomValues(secureKey);

// Example: Clear sensitive data
const tempKey = Bytes32.zero();
crypto.getRandomValues(tempKey);
// ... use key ...
// Clear when done:
tempKey.fill(0);
