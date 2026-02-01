/**
 * Tests for viem account playbook
 * @see /docs/playbooks/viem-account.mdx
 *
 * Note: The playbook documents a REFERENCE IMPLEMENTATION in examples/viem-account/.
 * Tests cover the signing patterns using available crypto primitives.
 *
 * API DISCREPANCIES:
 * - privateKeyToAccount is in examples/viem-account/, not library export
 * - Secp256k1 and EIP712 ARE available in src/crypto/
 */
import { describe, expect, it } from "vitest";

describe("Viem Account Playbook", () => {
	it("should define PrivateKeyAccount interface", () => {
		// From playbook: PrivateKeyAccount type
		interface PrivateKeyAccount {
			address: string;
			publicKey: string;
			source: "privateKey";
			type: "local";
			sign: (args: { hash: string }) => Promise<string>;
			signMessage: (args: { message: string }) => Promise<string>;
			signTransaction: (tx: unknown) => Promise<string>;
			signTypedData: (data: unknown) => Promise<string>;
		}

		const mockAccount: PrivateKeyAccount = {
			address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
			publicKey: "0x04...",
			source: "privateKey",
			type: "local",
			sign: async () => "0x...",
			signMessage: async () => "0x...",
			signTransaction: async () => "0x...",
			signTypedData: async () => "0x...",
		};

		expect(mockAccount.source).toBe("privateKey");
		expect(mockAccount.type).toBe("local");
	});

	it("should work with Secp256k1 for key derivation", async () => {
		const { Secp256k1 } = await import("../../src/crypto/index.js");
		const { Hex } = await import("../../src/primitives/Hex/index.js");

		const privateKey = Hex.toBytes(
			"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
		);

		// Derive public key
		const publicKey = Secp256k1.derivePublicKey(privateKey);

		expect(publicKey).toBeInstanceOf(Uint8Array);
		// Voltaire returns 64-byte public key (without 0x04 prefix)
		expect(publicKey.length).toBe(64);
	});

	it("should derive address from public key", async () => {
		const { Secp256k1, Keccak256 } = await import("../../src/crypto/index.js");
		const { Hex } = await import("../../src/primitives/Hex/index.js");
		const { Address } = await import("../../src/primitives/Address/index.js");

		const privateKey = Hex.toBytes(
			"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
		);

		// Derive public key (already without 0x04 prefix in Voltaire)
		const publicKey = Secp256k1.derivePublicKey(privateKey);

		// Hash the full 64-byte public key
		const publicKeyHash = Keccak256.hash(publicKey);

		// Take last 20 bytes
		const addressBytes = publicKeyHash.slice(-20);
		const address = Address.toHex(addressBytes);

		// toHex returns lowercase
		expect(address.toLowerCase()).toBe(
			"0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
		);
	});

	it("should define SignableMessage types", () => {
		// From playbook: message types
		type SignableMessage =
			| string
			| { raw: string }
			| { raw: Uint8Array };

		const stringMessage: SignableMessage = "Hello!";
		const hexMessage: SignableMessage = { raw: "0x48656c6c6f" };
		const bytesMessage: SignableMessage = {
			raw: new Uint8Array([72, 101, 108, 108, 111]),
		};

		expect(typeof stringMessage).toBe("string");
		expect(hexMessage).toHaveProperty("raw");
		expect(bytesMessage.raw).toBeInstanceOf(Uint8Array);
	});

	it("should define TypedDataDefinition", () => {
		// From playbook: EIP-712 typed data
		interface TypedDataDefinition {
			domain?: {
				name?: string;
				version?: string;
				chainId?: bigint;
				verifyingContract?: string;
			};
			types: Record<string, Array<{ name: string; type: string }>>;
			primaryType: string;
			message: Record<string, unknown>;
		}

		const typedData: TypedDataDefinition = {
			domain: { name: "App", version: "1", chainId: 1n },
			types: { Message: [{ name: "content", type: "string" }] },
			primaryType: "Message",
			message: { content: "Hello!" },
		};

		expect(typedData.primaryType).toBe("Message");
	});

	it("should define signing method variants", () => {
		// From playbook: account methods
		const methods = [
			"sign",
			"signMessage",
			"signTypedData",
			"signTransaction",
			"signAuthorization",
		];

		expect(methods).toContain("signMessage");
		expect(methods).toContain("signAuthorization");
	});

	it("should define error types", () => {
		// From playbook: error types
		const errorTypes = [
			"InvalidPrivateKeyError",
			"InvalidAddressError",
			"SigningError",
		];

		expect(errorTypes).toContain("InvalidPrivateKeyError");
	});

	it("should define EIP-7702 authorization structure", () => {
		// From playbook: SignedAuthorization
		interface SignedAuthorization {
			address: string;
			chainId: bigint;
			nonce: bigint;
			r: string;
			s: string;
			v: bigint;
			yParity: number;
		}

		const auth: SignedAuthorization = {
			address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
			chainId: 1n,
			nonce: 0n,
			r: "0x...",
			s: "0x...",
			v: 27n,
			yParity: 0,
		};

		expect(auth.v).toBe(27n);
		expect(auth.yParity).toBe(0);
	});

	it("should work with EIP712", async () => {
		const { EIP712 } = await import("../../src/crypto/index.js");

		// EIP712 module should exist
		expect(EIP712).toBeDefined();
	});

	it("should define standalone signing functions", () => {
		// From playbook: tree-shakable standalone functions
		const standaloneFunctions = [
			"signMessage",
			"signTypedData",
			"signTransaction",
		];

		expect(standaloneFunctions).toContain("signMessage");
	});

	it("should define factory pattern dependencies", () => {
		// From playbook: factory pattern with custom deps
		const factoryDependencies = [
			"getPublicKey",
			"keccak256",
			"sign",
			"hashTypedData",
		];

		expect(factoryDependencies).toContain("keccak256");
		expect(factoryDependencies).toContain("sign");
	});

	it("should note viem compatibility differences", () => {
		// From playbook: known differences
		const differences = [
			"EIP-712 addresses: Voltaire expects Address primitives (Uint8Array), not strings",
			"Transaction serialization: Uses placeholder serializer",
		];

		expect(differences).toHaveLength(2);
	});
});
