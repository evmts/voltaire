import { Nonce } from "@tevm/voltaire";

// Create from number (most common)
const nonce1 = Nonce(0);

const nonce2 = Nonce(42);

// Create from bigint (large values)
const nonce3 = Nonce(1000000n);

// Create from hex string
const nonce4 = Nonce("0x2a"); // 42 in hex

let currentNonce = Nonce(5);

// Increment to get next nonce
currentNonce = Nonce.increment(currentNonce);

// Chain multiple increments
currentNonce = Nonce.increment(currentNonce);
currentNonce = Nonce.increment(currentNonce);

const nonce = Nonce(999);

// Large nonce
const largeNonce = Nonce(9007199254740991n); // MAX_SAFE_INTEGER

// Simulate sending multiple transactions
let accountNonce = Nonce(0);
accountNonce = Nonce.increment(accountNonce);
accountNonce = Nonce.increment(accountNonce);
accountNonce = Nonce.increment(accountNonce);

const sentNonce = Nonce(10);
const receivedNonce = Nonce(10);

const nextNonce = Nonce(11);
