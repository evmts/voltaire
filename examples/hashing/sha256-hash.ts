// @title Hash String with SHA-256
// @description Hash a UTF-8 string using SHA-256 cryptographic hash function

// SNIPPET:START
import { SHA256 } from "../../src/crypto/SHA256/index.js";
import { Hex } from "../../src/primitives/Hex/index.js";

// Hash a simple string
const message = "Hello, World!";
const hash = SHA256.hash(new TextEncoder().encode(message));
const hexHash = Hex.fromBytes(hash);

// Hash another string
const hash2 = SHA256.hash(new TextEncoder().encode("Voltaire"));
const hexHash2 = Hex.fromBytes(hash2);
// SNIPPET:END

// Test assertions
import { strict as assert } from "node:assert";

assert.equal(
	hexHash,
	"0xdffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f",
);
assert.equal(hash.length, 32);
process.exit(0);
