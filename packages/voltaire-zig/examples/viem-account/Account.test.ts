/**
 * Tests for viem-account implementation
 */

import { beforeAll, describe, expect, it } from "vitest";
import { InvalidAddressError, InvalidPrivateKeyError } from "./errors.js";
import { privateKeyToAccount } from "./privateKeyToAccount.js";
import { hashMessage, signMessage } from "./signMessage.js";
import { signTransaction } from "./signTransaction.js";
import { signTypedData } from "./signTypedData.js";

// Test vectors from viem/foundry anvil
const TEST_PRIVATE_KEY =
	"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const TEST_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const TEST_PUBLIC_KEY =
	"0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5";

// Another test key
const TEST_PRIVATE_KEY_2 =
	"0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const TEST_ADDRESS_2 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

describe("privateKeyToAccount", () => {
	it("creates account from private key", () => {
		const account = privateKeyToAccount(TEST_PRIVATE_KEY);

		expect(account.address).toBe(TEST_ADDRESS);
		expect(account.publicKey).toBe(TEST_PUBLIC_KEY);
		expect(account.source).toBe("privateKey");
		expect(account.type).toBe("local");
	});

	it("creates different accounts from different keys", () => {
		const account1 = privateKeyToAccount(TEST_PRIVATE_KEY);
		const account2 = privateKeyToAccount(TEST_PRIVATE_KEY_2);

		expect(account1.address).toBe(TEST_ADDRESS);
		expect(account2.address).toBe(TEST_ADDRESS_2);
		expect(account1.address).not.toBe(account2.address);
	});

	it("rejects invalid private key (wrong length)", () => {
		expect(() => privateKeyToAccount("0x123")).toThrow(InvalidPrivateKeyError);
	});

	it("rejects private key without 0x prefix", () => {
		expect(() =>
			privateKeyToAccount(
				"ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			),
		).toThrow(InvalidPrivateKeyError);
	});

	it("rejects zero private key", () => {
		expect(() =>
			privateKeyToAccount(
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			),
		).toThrow(InvalidPrivateKeyError);
	});

	it("accepts nonce manager option", () => {
		const mockNonceManager = {
			consume: async () => 0n,
			get: async () => 0n,
			increment: () => {},
		};
		const account = privateKeyToAccount(TEST_PRIVATE_KEY, {
			nonceManager: mockNonceManager,
		});

		expect(account.nonceManager).toBe(mockNonceManager);
	});
});

describe("account.sign", () => {
	it("signs a hash", async () => {
		const account = privateKeyToAccount(TEST_PRIVATE_KEY);
		const hash =
			"0x0000000000000000000000000000000000000000000000000000000000000001";

		const signature = await account.sign({ hash });

		expect(signature).toMatch(/^0x[0-9a-f]{130}$/);
		expect(signature.length).toBe(132); // 0x + 65 bytes * 2
	});

	it("produces deterministic signatures", async () => {
		const account = privateKeyToAccount(TEST_PRIVATE_KEY);
		const hash =
			"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

		const sig1 = await account.sign({ hash });
		const sig2 = await account.sign({ hash });

		expect(sig1).toBe(sig2);
	});

	it("different hashes produce different signatures", async () => {
		const account = privateKeyToAccount(TEST_PRIVATE_KEY);
		const hash1 =
			"0x0000000000000000000000000000000000000000000000000000000000000001";
		const hash2 =
			"0x0000000000000000000000000000000000000000000000000000000000000002";

		const sig1 = await account.sign({ hash: hash1 });
		const sig2 = await account.sign({ hash: hash2 });

		expect(sig1).not.toBe(sig2);
	});
});

describe("account.signMessage", () => {
	it("signs string message", async () => {
		const account = privateKeyToAccount(TEST_PRIVATE_KEY);

		const signature = await account.signMessage({
			message: "Hello, Ethereum!",
		});

		expect(signature).toMatch(/^0x[0-9a-f]{130}$/);
	});

	it("signs raw hex message", async () => {
		const account = privateKeyToAccount(TEST_PRIVATE_KEY);

		const signature = await account.signMessage({
			message: { raw: "0x48656c6c6f" }, // "Hello" in hex
		});

		expect(signature).toMatch(/^0x[0-9a-f]{130}$/);
	});

	it("signs raw bytes message", async () => {
		const account = privateKeyToAccount(TEST_PRIVATE_KEY);
		const msgBytes = new TextEncoder().encode("Hello");

		const signature = await account.signMessage({
			message: { raw: msgBytes },
		});

		expect(signature).toMatch(/^0x[0-9a-f]{130}$/);
	});

	it("same message produces same signature", async () => {
		const account = privateKeyToAccount(TEST_PRIVATE_KEY);

		const sig1 = await account.signMessage({ message: "Test" });
		const sig2 = await account.signMessage({ message: "Test" });

		expect(sig1).toBe(sig2);
	});

	it("different messages produce different signatures", async () => {
		const account = privateKeyToAccount(TEST_PRIVATE_KEY);

		const sig1 = await account.signMessage({ message: "Test1" });
		const sig2 = await account.signMessage({ message: "Test2" });

		expect(sig1).not.toBe(sig2);
	});
});

describe("account.signTypedData", () => {
	// Simple typed data without addresses to test core functionality
	// Note: Voltaire's EIP712 expects addresses as Uint8Array, not strings
	// Full viem compatibility would require preprocessing address strings
	const typedData = {
		domain: {
			name: "Test App",
			version: "1",
			chainId: 1n,
		},
		types: {
			Message: [
				{ name: "content", type: "string" },
				{ name: "nonce", type: "uint256" },
			],
		},
		primaryType: "Message",
		message: {
			content: "Hello, Bob!",
			nonce: 123n,
		},
	};

	it("signs typed data", async () => {
		const account = privateKeyToAccount(TEST_PRIVATE_KEY);

		const signature = await account.signTypedData(typedData);

		expect(signature).toMatch(/^0x[0-9a-f]{130}$/);
	});

	it("produces deterministic signatures", async () => {
		const account = privateKeyToAccount(TEST_PRIVATE_KEY);

		const sig1 = await account.signTypedData(typedData);
		const sig2 = await account.signTypedData(typedData);

		expect(sig1).toBe(sig2);
	});

	it("different data produces different signatures", async () => {
		const account = privateKeyToAccount(TEST_PRIVATE_KEY);

		const sig1 = await account.signTypedData(typedData);
		const sig2 = await account.signTypedData({
			...typedData,
			message: {
				content: "Different message!",
				nonce: 456n,
			},
		});

		expect(sig1).not.toBe(sig2);
	});
});

describe("account.signTransaction", () => {
	it("signs transaction", async () => {
		const account = privateKeyToAccount(TEST_PRIVATE_KEY);

		const signature = await account.signTransaction({
			type: 2,
			chainId: 1n,
			nonce: 0n,
			maxFeePerGas: 20000000000n,
			maxPriorityFeePerGas: 1000000000n,
			gas: 21000n,
			to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
			value: 1000000000000000000n,
		});

		// Should return some serialized form
		expect(signature).toBeTruthy();
	});
});

describe("account.signAuthorization", () => {
	it("signs EIP-7702 authorization", async () => {
		const account = privateKeyToAccount(TEST_PRIVATE_KEY);

		const result = await account.signAuthorization({
			chainId: 1n,
			address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
			nonce: 0n,
		});

		expect(result.address).toBe("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
		expect(result.chainId).toBe(1n);
		expect(result.nonce).toBe(0n);
		expect(result.r).toMatch(/^0x[0-9a-f]{64}$/);
		expect(result.s).toMatch(/^0x[0-9a-f]{64}$/);
		expect(result.v).toBeTypeOf("bigint");
		expect(result.yParity).toBeTypeOf("number");
	});

	it("uses contractAddress over address", async () => {
		const account = privateKeyToAccount(TEST_PRIVATE_KEY);

		const result = await account.signAuthorization({
			chainId: 1n,
			address: "0x1111111111111111111111111111111111111111",
			contractAddress: "0x2222222222222222222222222222222222222222",
			nonce: 0n,
		});

		expect(result.address).toBe("0x2222222222222222222222222222222222222222");
	});
});

describe("hashMessage", () => {
	it("hashes string message with EIP-191 prefix", () => {
		const hash = hashMessage("Hello, Ethereum!");

		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});

	it("produces consistent hashes", () => {
		const hash1 = hashMessage("Test");
		const hash2 = hashMessage("Test");

		expect(Array.from(hash1)).toEqual(Array.from(hash2));
	});

	it("different messages produce different hashes", () => {
		const hash1 = hashMessage("Test1");
		const hash2 = hashMessage("Test2");

		expect(Array.from(hash1)).not.toEqual(Array.from(hash2));
	});
});

describe("signMessage (standalone)", () => {
	it("signs message with private key bytes", async () => {
		const privateKey = new Uint8Array(32);
		// Set to test key
		const hex = TEST_PRIVATE_KEY.slice(2);
		for (let i = 0; i < 32; i++) {
			privateKey[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
		}

		const signature = await signMessage({
			message: "Hello!",
			privateKey,
		});

		expect(signature).toMatch(/^0x[0-9a-f]{130}$/);
	});
});

describe("signTypedData (standalone)", () => {
	it("signs typed data with private key bytes", async () => {
		const privateKey = new Uint8Array(32);
		const hex = TEST_PRIVATE_KEY.slice(2);
		for (let i = 0; i < 32; i++) {
			privateKey[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
		}

		const signature = await signTypedData({
			domain: { name: "Test", version: "1" },
			types: {
				Message: [{ name: "content", type: "string" }],
			},
			primaryType: "Message",
			message: { content: "Hello" },
			privateKey,
		});

		expect(signature).toMatch(/^0x[0-9a-f]{130}$/);
	});
});

describe("signTransaction (standalone)", () => {
	it("signs transaction with private key bytes", async () => {
		const privateKey = new Uint8Array(32);
		const hex = TEST_PRIVATE_KEY.slice(2);
		for (let i = 0; i < 32; i++) {
			privateKey[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
		}

		const result = await signTransaction({
			privateKey,
			transaction: {
				type: 2,
				chainId: 1n,
				to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
			},
		});

		expect(result).toBeTruthy();
	});
});

describe("viem compatibility", () => {
	it("account has all required LocalAccount properties", () => {
		const account = privateKeyToAccount(TEST_PRIVATE_KEY);

		// Required properties
		expect(account).toHaveProperty("address");
		expect(account).toHaveProperty("publicKey");
		expect(account).toHaveProperty("source");
		expect(account).toHaveProperty("type");

		// Required methods
		expect(account).toHaveProperty("sign");
		expect(account).toHaveProperty("signAuthorization");
		expect(account).toHaveProperty("signMessage");
		expect(account).toHaveProperty("signTransaction");
		expect(account).toHaveProperty("signTypedData");

		// Method types
		expect(typeof account.sign).toBe("function");
		expect(typeof account.signAuthorization).toBe("function");
		expect(typeof account.signMessage).toBe("function");
		expect(typeof account.signTransaction).toBe("function");
		expect(typeof account.signTypedData).toBe("function");
	});

	it("address is checksummed", () => {
		const account = privateKeyToAccount(TEST_PRIVATE_KEY);

		// Should have mixed case (checksummed)
		expect(account.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
		expect(account.address).not.toBe(account.address.toLowerCase());
	});

	it("publicKey is uncompressed (65 bytes, 0x04 prefix)", () => {
		const account = privateKeyToAccount(TEST_PRIVATE_KEY);

		// 0x + 04 + 64 bytes = 2 + 2 + 128 = 132 chars
		expect(account.publicKey.length).toBe(132);
		expect(account.publicKey.slice(0, 4)).toBe("0x04");
	});

	it("source is 'privateKey'", () => {
		const account = privateKeyToAccount(TEST_PRIVATE_KEY);
		expect(account.source).toBe("privateKey");
	});

	it("type is 'local'", () => {
		const account = privateKeyToAccount(TEST_PRIVATE_KEY);
		expect(account.type).toBe("local");
	});
});
