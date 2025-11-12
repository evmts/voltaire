// @title Hello Voltaire
// @description Your first Voltaire example - hashing a simple string with Keccak256

// SNIPPET:START
import { Keccak256 } from "../../src/crypto/Keccak256/index.js";
import { Hex } from "../../src/primitives/Hex/index.js";

// Hash a string using Keccak256
const hash = Keccak256.hashString("Hello, Voltaire!");

// The hash is returned as a Uint8Array - convert to hex
const hexHash = Hex.fromBytes(hash);
// SNIPPET:END

// Test assertions - these run but are not included in docs
import { strict as assert } from "node:assert";

assert.equal(
	hexHash,
	"0xc0eadfd9fc84551045aac937d97969a3f5210b7981fe08bc406e855fab95e74c",
);

// Check hash is 32 bytes
assert.equal(hash.length, 32);
process.exit(0);
