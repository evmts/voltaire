import { Nonce } from "voltaire";

// Create from number (most common)
const nonce1 = Nonce.from(0);

const nonce2 = Nonce.from(42);

// Create from bigint (large values)
const nonce3 = Nonce.from(1000000n);

// Create from hex string
const nonce4 = Nonce.from("0x2a"); // 42 in hex

let currentNonce = Nonce.from(5);

// Increment to get next nonce
currentNonce = Nonce.increment(currentNonce);

// Chain multiple increments
currentNonce = Nonce.increment(currentNonce);
currentNonce = Nonce.increment(currentNonce);

const nonce = Nonce.from(999);

// Large nonce
const largeNonce = Nonce.from(9007199254740991n); // MAX_SAFE_INTEGER

// Simulate sending multiple transactions
let accountNonce = Nonce.from(0);
accountNonce = Nonce.increment(accountNonce);
accountNonce = Nonce.increment(accountNonce);
accountNonce = Nonce.increment(accountNonce);

const sentNonce = Nonce.from(10);
const receivedNonce = Nonce.from(10);

const nextNonce = Nonce.from(11);
