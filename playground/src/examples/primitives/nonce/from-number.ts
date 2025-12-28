import { Nonce } from "voltaire";

// Zero nonce (first transaction for an account)
const firstTx = Nonce.from(0);

// Small values
const nonce10 = Nonce.from(10);

const nonce100 = Nonce.from(100);

// Larger values
const nonce1k = Nonce.from(1000);

const nonce1m = Nonce.from(1_000_000);

// From bigint (for very large nonces)
const hugeTxCount = Nonce.from(9_007_199_254_740_991n); // MAX_SAFE_INTEGER

// From hex string
const hexNonce = Nonce.from("0x64"); // 100 in hex

const largeHex = Nonce.from("0xf4240"); // 1,000,000 in hex
