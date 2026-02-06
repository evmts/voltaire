/**
 * Tests for sign and verify messages guide
 * @see /docs/guides/sign-verify-messages.mdx
 *
 * Note: The guide references SignedData, Secp256k1, Keccak256, and Address primitives.
 */
import { describe, expect, it } from "vitest";

describe("Sign & Verify Messages Guide", () => {
	it("should hash personal message with EIP-191 prefix", async () => {
		const { Keccak256 } = await import("../../src/crypto/index.js");

		// Manual EIP-191 hash construction as shown in docs
		const message = "Hello";
		const prefix = new TextEncoder().encode(
			`\x19Ethereum Signed Message:\n${message.length}`,
		);
		const messageBytes = new TextEncoder().encode(message);
		const data = new Uint8Array(prefix.length + messageBytes.length);
		data.set(prefix, 0);
		data.set(messageBytes, prefix.length);

		const hash = Keccak256.hash(data);
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});

	it("should sign messages with Secp256k1", async () => {
		const { Keccak256, Secp256k1 } = await import("../../src/crypto/index.js");

		// Create a random private key
		const privateKey = Secp256k1.randomPrivateKey();
		expect(privateKey.length).toBe(32);

		// Hash a message
		const message = "Sign this message to authenticate";
		const prefix = new TextEncoder().encode(
			`\x19Ethereum Signed Message:\n${message.length}`,
		);
		const messageBytes = new TextEncoder().encode(message);
		const data = new Uint8Array(prefix.length + messageBytes.length);
		data.set(prefix, 0);
		data.set(messageBytes, prefix.length);
		const messageHash = Keccak256.hash(data);

		// Sign the hash
		const signature = Secp256k1.sign(messageHash, privateKey);

		expect(signature).toHaveProperty("r");
		expect(signature).toHaveProperty("s");
		expect(signature).toHaveProperty("v");
		expect(signature.r).toBeInstanceOf(Uint8Array);
		expect(signature.s).toBeInstanceOf(Uint8Array);
		expect(signature.r.length).toBe(32);
		expect(signature.s.length).toBe(32);
		expect([27, 28]).toContain(signature.v);
	});

	it("should derive public key from private key", async () => {
		const { Secp256k1 } = await import("../../src/crypto/index.js");

		const privateKey = Secp256k1.randomPrivateKey();
		const publicKey = Secp256k1.derivePublicKey(privateKey);

		expect(publicKey).toBeInstanceOf(Uint8Array);
		expect(publicKey.length).toBe(64); // Uncompressed (x || y)
	});

	it("should recover public key from signature", async () => {
		const { Keccak256, Secp256k1 } = await import("../../src/crypto/index.js");

		const privateKey = Secp256k1.randomPrivateKey();
		const originalPublicKey = Secp256k1.derivePublicKey(privateKey);

		// Sign a message
		const message = "Test message";
		const prefix = new TextEncoder().encode(
			`\x19Ethereum Signed Message:\n${message.length}`,
		);
		const messageBytes = new TextEncoder().encode(message);
		const data = new Uint8Array(prefix.length + messageBytes.length);
		data.set(prefix, 0);
		data.set(messageBytes, prefix.length);
		const messageHash = Keccak256.hash(data);

		const signature = Secp256k1.sign(messageHash, privateKey);

		// Recover public key
		const recoveredPublicKey = Secp256k1.recoverPublicKey(
			signature,
			messageHash,
		);

		expect(recoveredPublicKey).toBeInstanceOf(Uint8Array);
		expect(recoveredPublicKey.length).toBe(64);
		expect(recoveredPublicKey).toEqual(originalPublicKey);
	});

	it("should derive address from public key", async () => {
		const { Secp256k1 } = await import("../../src/crypto/index.js");
		const { Address } = await import("../../src/primitives/Address/index.js");

		const privateKey = Secp256k1.randomPrivateKey();
		const publicKey = Secp256k1.derivePublicKey(privateKey);

		const address = Address.fromPublicKey(publicKey);

		expect(address).toBeInstanceOf(Uint8Array);
		expect(address.length).toBe(20);

		const hex = Address.toHex(address);
		expect(hex).toMatch(/^0x[a-fA-F0-9]{40}$/);
	});

	it("should verify signature round-trip", async () => {
		const { Keccak256, Secp256k1 } = await import("../../src/crypto/index.js");
		const { Address } = await import("../../src/primitives/Address/index.js");

		// Generate key pair
		const privateKey = Secp256k1.randomPrivateKey();
		const publicKey = Secp256k1.derivePublicKey(privateKey);
		const address = Address.fromPublicKey(publicKey);

		// Sign a message
		const message = "I agree to the terms of service";
		const prefix = new TextEncoder().encode(
			`\x19Ethereum Signed Message:\n${message.length}`,
		);
		const messageBytes = new TextEncoder().encode(message);
		const data = new Uint8Array(prefix.length + messageBytes.length);
		data.set(prefix, 0);
		data.set(messageBytes, prefix.length);
		const messageHash = Keccak256.hash(data);

		const signature = Secp256k1.sign(messageHash, privateKey);

		// Recover and verify
		const recoveredPublicKey = Secp256k1.recoverPublicKey(
			signature,
			messageHash,
		);
		const recoveredAddress = Address.fromPublicKey(recoveredPublicKey);

		// Addresses should match
		expect(Address.equals(address, recoveredAddress)).toBe(true);
	});

	it("should format signature components as hex", async () => {
		const { Keccak256, Secp256k1 } = await import("../../src/crypto/index.js");
		const { Hex } = await import("../../src/primitives/Hex/index.js");

		const privateKey = Secp256k1.randomPrivateKey();

		const message = "Test";
		const prefix = new TextEncoder().encode(
			`\x19Ethereum Signed Message:\n${message.length}`,
		);
		const messageBytes = new TextEncoder().encode(message);
		const data = new Uint8Array(prefix.length + messageBytes.length);
		data.set(prefix, 0);
		data.set(messageBytes, prefix.length);
		const messageHash = Keccak256.hash(data);

		const signature = Secp256k1.sign(messageHash, privateKey);

		const rHex = Hex.fromBytes(signature.r);
		const sHex = Hex.fromBytes(signature.s);

		expect(rHex).toMatch(/^0x[a-fA-F0-9]{64}$/);
		expect(sHex).toMatch(/^0x[a-fA-F0-9]{64}$/);
	});
});
