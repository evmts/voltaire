// @title Personal Sign Message
// @description Sign a message using Ethereum personal_sign (EIP-191) format

// SNIPPET:START
import { Hex, Keccak256, Secp256k1 } from "@tevm/voltaire";

// Create a private key (32 bytes)
const privateKey = Hex.toBytes(
	"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
);

// Message to sign
const message = "Hello, Ethereum!";

// Personal sign format: "\x19Ethereum Signed Message:\n" + len(message) + message
const prefix = "\x19Ethereum Signed Message:\n";
const messageBytes = new TextEncoder().encode(message);
const prefixedMessage = new TextEncoder().encode(
	prefix + messageBytes.length + message,
);

// Hash the prefixed message
const messageHash = Keccak256(prefixedMessage);

// Sign the hash
const signature = Secp256k1.sign(messageHash, privateKey);
// SNIPPET:END

// Test assertions
import { strict as assert } from "node:assert";

assert.equal(signature.r.length, 32);
assert.equal(signature.s.length, 32);
assert.equal(signature.v === 27 || signature.v === 28, true);
process.exit(0);
