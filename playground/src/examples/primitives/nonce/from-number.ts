import { Nonce } from "@tevm/voltaire";

// Zero nonce (first transaction for an account)
const firstTx = Nonce(0);

// Small values
const nonce10 = Nonce(10);

const nonce100 = Nonce(100);

// Larger values
const nonce1k = Nonce(1000);

const nonce1m = Nonce(1_000_000);

// From bigint (for very large nonces)
const hugeTxCount = Nonce(9_007_199_254_740_991n); // MAX_SAFE_INTEGER

// From hex string
const hexNonce = Nonce("0x64"); // 100 in hex

const largeHex = Nonce("0xf4240"); // 1,000,000 in hex
