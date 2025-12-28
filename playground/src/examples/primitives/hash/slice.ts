import { Hash } from "voltaire";
// Example: Slicing hashes to extract portions

const hash = Hash.fromHex(
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
);

// Extract first 16 bytes
const first16 = Hash.slice(hash, 0, 16);

// Extract last 16 bytes
const last16 = Hash.slice(hash, 16, 32);

// Extract middle portion (bytes 8-24)
const middle = Hash.slice(hash, 8, 24);

// First 4 bytes (commonly used as selector)
const first4 = Hash.slice(hash, 0, 4);

// Slice with undefined end (to end of hash)
const fromByte10 = Hash.slice(hash, 10);
