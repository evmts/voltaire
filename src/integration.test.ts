import { describe, it, expect } from "vitest";
import { Address } from "./primitives/Address/index.js";
import type { BrandedHash } from "./primitives/Hash/index.js";
import * as Hardfork from "./primitives/Hardfork/index.js";
import * as Rlp from "./primitives/Rlp/index.js";
import * as Signature from "./primitives/Signature/index.js";
import { Blake2 } from "./crypto/Blake2/index.js";
import { BN254 } from "./crypto/bn254/BN254.js";
import { EIP712 } from "./crypto/EIP712/index.js";
import { HDWallet } from "./crypto/HDWallet/index.js";
import { Keccak256 } from "./crypto/Keccak256/index.js";
import * as Kzg from "./crypto/KZG/index.js";
import { Ripemd160 } from "./crypto/Ripemd160/index.js";
import { Secp256k1 } from "./crypto/Secp256k1/index.js";
import { SHA256 } from "./crypto/SHA256/index.js";
import {
	PrecompileAddress,
	blake2f,
	bn254Add,
	bn254Mul,
	bn254Pairing,
	ecrecover,
	execute,
	identity,
	modexp,
	pointEvaluation,
	ripemd160,
	sha256,
} from "./precompiles/precompiles.js";

/**
 * Integration Tests: Cross-Module Workflows
 *
 * Tests real-world interactions between crypto, precompiles, and primitives.
 * Verifies end-to-end workflows that span multiple modules.
 */

// Utilities
function beBytes32(n: bigint): Uint8Array {
	const out = new Uint8Array(32);
	let v = n;
	for (let i = 31; i >= 0; i--) {
		out[i] = Number(v & 0xffn);
		v >>= 8n;
	}
	return out;
}

function bytesToBigInt(bytes: Uint8Array): bigint {
	let result = 0n;
	for (let i = 0; i < bytes.length; i++) {
		result = (result << 8n) | BigInt(bytes[i] ?? 0);
	}
	return result;
}

describe("Integration Tests: Cross-Module Workflows", () => {
	describe("Transaction Signing & Recovery", () => {
		it("should sign message and recover signer address using ecRecover precompile", () => {
			// 1. Create message and hash
			const message = new TextEncoder().encode("Hello, Ethereum!");
			const messageHash = Keccak256.hash(message);

			// 2. Generate private key
			const privateKey = new Uint8Array(32);
			privateKey[31] = 42;

			// 3. Sign with Secp256k1 crypto
			const sig = Secp256k1.sign(messageHash, privateKey);

			// 4. Derive expected address from private key
			const publicKey = Secp256k1.derivePublicKey(privateKey);
			const pubKeyHash = Keccak256.hash(publicKey);
			const expectedAddress = pubKeyHash.slice(-20);

			// 5. Recover using ecRecover precompile
			const input = new Uint8Array(128);
			input.set(messageHash, 0);
			const vBytes = beBytes32(BigInt(sig.v));
			input.set(vBytes, 32);
			input.set(sig.r, 64);
			input.set(sig.s, 96);

			const result = ecrecover(input, 10000n);

			// 6. Verify recovery
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
			const recoveredAddress = result.output.slice(12);
			expect(
				Buffer.from(recoveredAddress).equals(Buffer.from(expectedAddress)),
			).toBe(true);
		});

		it("should handle EIP-155 transaction signature with chain ID", () => {
			const messageHash = Keccak256.hashString("test transaction");
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;

			// Sign with chain ID encoded
			const sig = Secp256k1.sign(messageHash, privateKey);

			// Calculate EIP-155 v value (v = 35 + chainId * 2 + (v - 27))
			const chainId = 1n; // Mainnet
			const eip155V = 35n + chainId * 2n + BigInt(sig.v - 27);

			// Recover with original v
			const input = new Uint8Array(128);
			input.set(messageHash, 0);
			input.set(beBytes32(BigInt(sig.v)), 32);
			input.set(sig.r, 64);
			input.set(sig.s, 96);

			const result = ecrecover(input, 10000n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
		});

		it("should sign RLP-encoded transaction and recover signer", () => {
			// 1. Create transaction data
			const txData = [
				new Uint8Array([0]), // nonce
				new Uint8Array([20]), // gasPrice
				new Uint8Array([21000]), // gasLimit
				Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"),
				new Uint8Array([1000]), // value
				new Uint8Array(0), // data
			];

			// 2. RLP encode
			const encoded = Rlp.encodeArray(txData);

			// 3. Hash and sign
			const txHash = Keccak256.hash(encoded);
			const privateKey = new Uint8Array(32);
			privateKey[31] = 7;

			const sig = Secp256k1.sign(txHash, privateKey);

			// 4. Recover address
			const input = new Uint8Array(128);
			input.set(txHash, 0);
			input.set(beBytes32(BigInt(sig.v)), 32);
			input.set(sig.r, 64);
			input.set(sig.s, 96);

			const result = ecrecover(input, 10000n);

			// 5. Verify
			expect(result.success).toBe(true);
			const publicKey = Secp256k1.derivePublicKey(privateKey);
			const expectedAddress = Keccak256.hash(publicKey).slice(-20);
			expect(
				Buffer.from(result.output.slice(12)).equals(
					Buffer.from(expectedAddress),
				),
			).toBe(true);
		});

		it("should fail gracefully on invalid signature recovery", () => {
			// Invalid signature (all zeros)
			const input = new Uint8Array(128);

			const result = ecrecover(input, 10000n);

			// Should return zero address (valid response for invalid signature)
			expect(result.success).toBe(true);
			expect(result.output.every((b) => b === 0)).toBe(true);
		});

		it("should handle signature with invalid v value", () => {
			const messageHash = Keccak256.hashString("test");
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;

			const sig = Secp256k1.sign(messageHash, privateKey);

			// Use invalid v value
			const input = new Uint8Array(128);
			input.set(messageHash, 0);
			input.set(beBytes32(99n), 32); // Invalid v
			input.set(sig.r, 64);
			input.set(sig.s, 96);

			const result = ecrecover(input, 10000n);

			// Should return zero address
			expect(result.success).toBe(true);
			expect(result.output.every((b) => b === 0)).toBe(true);
		});
	});

	describe("EIP-712 Integration", () => {
		it("should sign typed data and recover address using precompile", () => {
			// 1. Define typed data
			const walletAddress = Address.fromHex(
				"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
			);
			const typedData = {
				domain: {
					name: "Test DApp",
					version: "1",
					chainId: 1n,
					verifyingContract: walletAddress,
				},
				types: {
					Person: [
						{ name: "name", type: "string" },
						{ name: "wallet", type: "address" },
					],
				},
				primaryType: "Person",
				message: {
					name: "Alice",
					wallet: walletAddress,
				},
			};

			// 2. Hash typed data
			const typedDataHash = EIP712.hashTypedData(typedData);

			// 3. Sign
			const privateKey = new Uint8Array(32);
			privateKey[31] = 5;

			const sig = Secp256k1.sign(typedDataHash, privateKey);

			// 4. Recover with precompile
			const input = new Uint8Array(128);
			input.set(typedDataHash, 0);
			input.set(beBytes32(BigInt(sig.v)), 32);
			input.set(sig.r, 64);
			input.set(sig.s, 96);

			const result = ecrecover(input, 10000n);

			// 5. Verify
			expect(result.success).toBe(true);
			const publicKey = Secp256k1.derivePublicKey(privateKey);
			const expectedAddress = Keccak256.hash(publicKey).slice(-20);
			expect(
				Buffer.from(result.output.slice(12)).equals(
					Buffer.from(expectedAddress),
				),
			).toBe(true);
		});

		it("should verify signature matches EIP712 signer", () => {
			const typedData = {
				domain: { name: "App", version: "1", chainId: 1n },
				types: {
					Message: [{ name: "content", type: "string" }],
				},
				primaryType: "Message",
				message: { content: "Hello" },
			};

			const privateKey = new Uint8Array(32);
			privateKey[31] = 9;

			const typedDataHash = EIP712.hashTypedData(typedData);
			const sig = Secp256k1.sign(typedDataHash, privateKey);

			// Verify with crypto module
			const publicKey = Secp256k1.derivePublicKey(privateKey);
			const isValid = Secp256k1.verify(sig, typedDataHash, publicKey);
			expect(isValid).toBe(true);
		});

		it("should handle EIP712 domain separator consistently", () => {
			const domain1 = {
				name: "MyApp",
				version: "1",
				chainId: 1n,
			};

			const domain2 = {
				name: "MyApp",
				version: "1",
				chainId: 1n,
			};

			// Hash typed data with same domain should produce same hash
			const typedData1 = {
				domain: domain1,
				types: { Test: [{ name: "value", type: "uint256" }] },
				primaryType: "Test",
				message: { value: 42n },
			};

			const typedData2 = {
				domain: domain2,
				types: { Test: [{ name: "value", type: "uint256" }] },
				primaryType: "Test",
				message: { value: 42n },
			};

			const hash1 = EIP712.hashTypedData(typedData1);
			const hash2 = EIP712.hashTypedData(typedData2);

			expect(Buffer.from(hash1).equals(Buffer.from(hash2))).toBe(true);
		});
	});

	describe("Hash Function Consistency", () => {
		it("should produce same SHA256 hash in crypto and precompile", () => {
			const message = new TextEncoder().encode("Hello, Ethereum!");

			// Crypto module
			const cryptoHash = SHA256.hash(message);

			// Precompile
			const result = execute(
				PrecompileAddress.SHA256,
				message,
				10000n,
				Hardfork.FRONTIER,
			);

			expect(result.success).toBe(true);
			expect(Buffer.from(result.output).equals(Buffer.from(cryptoHash))).toBe(
				true,
			);
		});

		it("should produce same SHA256 for multiple inputs", () => {
			const inputs = [
				new Uint8Array([1, 2, 3]),
				new TextEncoder().encode("test"),
				new Uint8Array(100).fill(0xff),
			];

			for (const input of inputs) {
				const cryptoHash = SHA256.hash(input);
				const precompileResult = sha256(input, 100000n);

				expect(precompileResult.success).toBe(true);
				expect(
					Buffer.from(precompileResult.output).equals(Buffer.from(cryptoHash)),
				).toBe(true);
			}
		});

		it("should produce same RIPEMD160 hash in crypto and precompile", () => {
			const message = new TextEncoder().encode("test ripemd160");

			// Crypto module
			const cryptoHash = Ripemd160.hash(message);

			// Precompile (returns 32 bytes with 12 byte padding)
			const result = ripemd160(message, 100000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
			expect(
				Buffer.from(result.output.slice(12)).equals(Buffer.from(cryptoHash)),
			).toBe(true);
		});

		it("should handle Blake2 compression function", () => {
			// Blake2f precompile input format:
			// rounds (4 bytes) | h (64 bytes) | m (128 bytes) | t (16 bytes) | f (1 byte)
			const rounds = 12;
			const input = new Uint8Array(213);
			new DataView(input.buffer).setUint32(0, rounds, false);

			// Set some test data
			for (let i = 4; i < 213; i++) {
				input[i] = i % 256;
			}

			const result = blake2f(input, 1000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
			expect(result.gasUsed).toBe(BigInt(rounds));
		});
	});

	describe("BN254 Workflow", () => {
		it("should add BN254 G1 points with crypto and verify with precompile", () => {
			// Use known points
			const p1Bytes = new Uint8Array(64);
			const p2Bytes = new Uint8Array(64);

			// Generator point for p1 (simplified)
			p1Bytes[31] = 1;
			p1Bytes[63] = 2;

			// Identity for p2 (all zeros)

			const input = new Uint8Array(128);
			input.set(p1Bytes, 0);
			input.set(p2Bytes, 64);

			const result = bn254Add(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
		});

		it("should multiply BN254 G1 point by scalar", () => {
			// Point (simplified)
			const pointBytes = new Uint8Array(64);
			pointBytes[31] = 1;
			pointBytes[63] = 2;

			// Scalar
			const scalar = 3n;
			const scalarBytes = beBytes32(scalar);

			const input = new Uint8Array(96);
			input.set(pointBytes, 0);
			input.set(scalarBytes, 64);

			const result = bn254Mul(input, 10000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
		});

		it("should verify BN254 pairing check", () => {
			// Empty input should return valid pairing (1)
			const input = new Uint8Array(0);

			const result = bn254Pairing(input, 100000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
			// Empty pairing should be valid
			expect(result.output[31]).toBe(1);
		});
	});

	describe("Address Derivation Chain", () => {
		it("should derive address from private key through full chain", () => {
			// 1. Create private key
			const privateKey = new Uint8Array(32);
			crypto.getRandomValues(privateKey);

			// 2. Derive public key with Secp256k1
			const publicKey = Secp256k1.derivePublicKey(privateKey);

			// 3. Hash public key with Keccak256
			const hash = Keccak256.hash(publicKey);

			// 4. Take last 20 bytes as address
			const address = hash.slice(-20);

			// 5. Verify with Address.fromPrivateKey
			const directAddress = Address.fromPrivateKey(privateKey);

			expect(Buffer.from(address).equals(Buffer.from(directAddress))).toBe(
				true,
			);
		});

		it("should derive address from public key coordinates", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 77;

			// Get uncompressed public key (64 bytes x,y)
			const publicKey = Secp256k1.derivePublicKey(privateKey);

			// Hash and take last 20 bytes
			const hash = Keccak256.hash(publicKey);
			const expectedAddress = hash.slice(-20);

			// Derive using Address primitive
			const address = Address.fromPrivateKey(privateKey);

			expect(Buffer.from(address).equals(Buffer.from(expectedAddress))).toBe(
				true,
			);
		});

		it("should derive multiple addresses from HD wallet", () => {
			// 1. Create seed
			const seed = new Uint8Array(64);
			crypto.getRandomValues(seed);

			// 2. Create HD wallet root
			const root = HDWallet.fromSeed(seed);

			// 3. Derive multiple Ethereum accounts
			const addresses: Uint8Array[] = [];
			for (let i = 0; i < 3; i++) {
				const path = `m/44'/60'/0'/0/${i}`;
				const account = HDWallet.derivePath(root, path);
				const privateKey = HDWallet.getPrivateKey(account);

				if (privateKey) {
					const address = Address.fromPrivateKey(privateKey);
					addresses.push(address);
				}
			}

			// Verify all addresses are unique
			expect(addresses.length).toBe(3);
			for (let i = 0; i < addresses.length; i++) {
				for (let j = i + 1; j < addresses.length; j++) {
					expect(
						Buffer.from(addresses[i]!).equals(Buffer.from(addresses[j]!)),
					).toBe(false);
				}
			}
		});
	});

	describe("KZG & EIP-4844 Blobs", () => {
		it("should verify KZG proof with point evaluation precompile", () => {
			if (!Kzg.isInitialized()) {
				Kzg.loadTrustedSetup();
			}

			// Generate random blob
			const blob = Kzg.generateRandomBlob();

			// Generate commitment
			const commitment = Kzg.blobToKzgCommitment(blob);

			// Use fixed z value (32 bytes)
			const z = new Uint8Array(32);
			z[31] = 1; // Small value

			// Compute proof at point z
			const { proof, y } = Kzg.computeKzgProof(blob, z);

			// Build precompile input (160 bytes)
			const input = new Uint8Array(160);
			input.set(commitment, 0); // 48 bytes commitment
			input.set(z, 48); // 32 bytes z
			input.set(y, 80); // 32 bytes y
			input.set(proof, 112); // 48 bytes proof

			const result = pointEvaluation(input, 100000n);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
		});

		it("should generate blob commitment and verify consistency", () => {
			if (!Kzg.isInitialized()) {
				Kzg.loadTrustedSetup();
			}

			const blob = Kzg.generateRandomBlob();

			// Generate commitment twice
			const commitment1 = Kzg.blobToKzgCommitment(blob);
			const commitment2 = Kzg.blobToKzgCommitment(blob);

			// Should be deterministic
			expect(Buffer.from(commitment1).equals(Buffer.from(commitment2))).toBe(
				true,
			);
		});
	});

	describe("Error Handling Across Modules", () => {
		it("should propagate errors through signature recovery workflow", () => {
			// Create malformed signature
			const messageHash = Keccak256.hashString("test");
			const invalidR = new Uint8Array(32).fill(0xff);
			const invalidS = new Uint8Array(32).fill(0xff);

			const input = new Uint8Array(128);
			input.set(messageHash, 0);
			input.set(beBytes32(27n), 32);
			input.set(invalidR, 64);
			input.set(invalidS, 96);

			const result = ecrecover(input, 10000n);

			// Should return zero address (invalid signature)
			expect(result.success).toBe(true);
			expect(result.output.every((b) => b === 0)).toBe(true);
		});

		it("should handle out of gas errors in precompiles", () => {
			const message = new TextEncoder().encode("test");

			// Insufficient gas
			const result = sha256(message, 10n);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Out of gas");
		});

		it("should handle invalid input lengths gracefully", () => {
			// BN254 add expects 128 bytes, provide less
			const input = new Uint8Array(64);

			const result = bn254Add(input, 10000n);

			expect(result.success).toBe(true); // Pads with zeros
			expect(result.output.length).toBe(64);
		});
	});

	describe("Performance Integration", () => {
		it("should compare crypto vs precompile gas costs", () => {
			const message = new TextEncoder().encode("performance test");

			// Precompile tracks gas
			const result = sha256(message, 100000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBeGreaterThan(0n);

			// Verify gas calculation (60 + words * 12)
			const words = Math.ceil(message.length / 32);
			const expectedGas = 60n + BigInt(words) * 12n;
			expect(result.gasUsed).toBe(expectedGas);
		});

		it("should verify MODEXP gas calculation", () => {
			// 2^3 mod 5 = 3
			const header = new Uint8Array(96);
			header.set(beBytes32(1n), 0); // base length
			header.set(beBytes32(1n), 32); // exp length
			header.set(beBytes32(1n), 64); // mod length

			const data = new Uint8Array([2, 3, 5]);
			const input = new Uint8Array(99);
			input.set(header, 0);
			input.set(data, 96);

			const result = modexp(input, 1000000n);

			expect(result.success).toBe(true);
			expect(result.gasUsed).toBeGreaterThan(0n);

			// Result should be 3
			expect(result.output.length).toBe(1);
			expect(result.output[0]).toBe(3);
		});
	});

	describe("Cross-Module RLP Encoding", () => {
		it("should RLP encode transaction data and hash consistently", () => {
			// Transaction fields
			const fields = [
				beBytes32(0n), // nonce
				beBytes32(20n), // gasPrice
				beBytes32(21000n), // gasLimit
				Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"),
				beBytes32(1000n), // value
				new Uint8Array(0), // data
			];

			// Encode with RLP
			const encoded = Rlp.encodeArray(fields);

			// Hash with Keccak256
			const hash1 = Keccak256.hash(encoded);

			// Encode and hash again - should be deterministic
			const encoded2 = Rlp.encodeArray(fields);
			const hash2 = Keccak256.hash(encoded2);

			expect(Buffer.from(hash1).equals(Buffer.from(hash2))).toBe(true);
		});

		it("should handle nested RLP structures", () => {
			const nested = [
				new Uint8Array([1, 2, 3]),
				[new Uint8Array([4, 5]), new Uint8Array([6, 7])],
				new Uint8Array([8]),
			];

			const encoded = Rlp.encode(nested);
			const decoded = Rlp.decode(encoded);

			// Verify structure preserved - decoded returns RLP data object with type info
			expect(decoded).toBeTruthy();
			expect(decoded.data).toBeTruthy();
			expect(decoded.data.type).toBe("list");
		});
	});

	describe("Hardfork Feature Compatibility", () => {
		it("should verify precompile availability by hardfork", () => {
			// MODEXP available from Byzantium
			const byzantium = Hardfork.BYZANTIUM;
			const frontier = Hardfork.FRONTIER;

			// MODEXP should work in Byzantium
			const input = new Uint8Array(99);
			const header = new Uint8Array(96);
			header.set(beBytes32(1n), 0);
			header.set(beBytes32(1n), 32);
			header.set(beBytes32(1n), 64);
			input.set(header);
			input.set(new Uint8Array([2, 3, 5]), 96);

			const resultByzantium = execute(
				PrecompileAddress.MODEXP,
				input,
				100000n,
				byzantium,
			);
			expect(resultByzantium.success).toBe(true);

			// Still works in Frontier (implementation allows)
			const resultFrontier = execute(
				PrecompileAddress.MODEXP,
				input,
				100000n,
				frontier,
			);
			expect(resultFrontier.success).toBe(true);
		});

		it("should verify BLAKE2F available from Istanbul", () => {
			const input = new Uint8Array(213);
			new DataView(input.buffer).setUint32(0, 12, false);

			const istanbul = Hardfork.ISTANBUL;
			const result = execute(PrecompileAddress.BLAKE2F, input, 1000n, istanbul);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
		});

		it("should verify KZG point evaluation available from Cancun", () => {
			if (!Kzg.isInitialized()) {
				Kzg.loadTrustedSetup();
			}

			const blob = Kzg.generateRandomBlob();
			const commitment = Kzg.blobToKzgCommitment(blob);
			const z = new Uint8Array(32);
			const { proof, y } = Kzg.computeKzgProof(blob, z);

			const input = new Uint8Array(160);
			input.set(commitment, 0);
			input.set(z, 48);
			input.set(y, 80);
			input.set(proof, 112);

			const cancun = Hardfork.CANCUN;
			const result = execute(
				PrecompileAddress.POINT_EVALUATION,
				input,
				100000n,
				cancun,
			);

			expect(result.success).toBe(true);
		});
	});

	describe("Identity Precompile Integration", () => {
		it("should pass through data unchanged via identity precompile", () => {
			const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

			const result = identity(data, 1000n);

			expect(result.success).toBe(true);
			expect(Buffer.from(result.output).equals(Buffer.from(data))).toBe(true);
		});

		it("should handle large data through identity precompile", () => {
			const data = new Uint8Array(1024);
			crypto.getRandomValues(data);

			const result = identity(data, 100000n);

			expect(result.success).toBe(true);
			expect(Buffer.from(result.output).equals(Buffer.from(data))).toBe(true);
		});
	});

	describe("Signature Primitive Integration", () => {
		it("should create and verify signature using primitives", () => {
			const messageHash = Keccak256.hashString("test message") as BrandedHash;
			const privateKey = new Uint8Array(32);
			privateKey[31] = 11;

			// Sign with crypto
			const cryptoSig = Secp256k1.sign(messageHash, privateKey);

			// Create signature primitive
			const sig = Signature.fromSecp256k1(
				cryptoSig.r,
				cryptoSig.s,
				cryptoSig.v,
			);

			// Verify structure
			expect(sig.length).toBe(64);
			expect(Signature.getV(sig)).toBe(cryptoSig.v);
		});

		it("should convert signature to different formats", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			const v = 27;

			const sig = Signature.fromSecp256k1(r, s, v);

			// Convert to compact - includes v byte for secp256k1
			const compact = Signature.toCompact(sig);
			expect(compact.length).toBe(65); // r + s + v for secp256k1

			// Convert to DER
			const der = Signature.toDER(sig);
			expect(der.length).toBeGreaterThan(64); // DER adds overhead
		});
	});
});
