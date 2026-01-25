import { Hash } from "@tevm/voltaire";
import * as VoltaireSecp256k1 from "@tevm/voltaire/Secp256k1";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { describe, expect, it } from "vitest";
import * as Secp256k1 from "./index.js";

describe("Secp256k1", () => {
	const testPrivateKeyBytes = new Uint8Array([
		0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c,
		0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18,
		0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20,
	]);

	const testMessageHashBytes = new Uint8Array([
		0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x00, 0x11, 0x22, 0x33, 0x44, 0x55,
		0x66, 0x77, 0x88, 0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x00, 0x11,
		0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99,
	]);
	const testMessageHash = Hash.from(testMessageHashBytes);

	describe("sign", () => {
		it("signs a message hash with a private key", async () => {
			const result = await Effect.runPromise(
				Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any),
			);

			expect(result).toHaveProperty("r");
			expect(result).toHaveProperty("s");
			expect(result).toHaveProperty("v");
			expect(result.r.length).toBe(32);
			expect(result.s.length).toBe(32);
			expect([27, 28]).toContain(result.v);
		});

		it("produces deterministic signatures (RFC 6979)", async () => {
			const sig1 = await Effect.runPromise(
				Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any),
			);
			const sig2 = await Effect.runPromise(
				Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any),
			);

			expect(sig1.r).toEqual(sig2.r);
			expect(sig1.s).toEqual(sig2.s);
			expect(sig1.v).toEqual(sig2.v);
		});

		it("fails with zero private key", async () => {
			const zeroKey = new Uint8Array(32);
			const exit = await Effect.runPromiseExit(
				Secp256k1.sign(testMessageHash, zeroKey as any),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});
	});

	describe("recover", () => {
		it("recovers public key from signature", async () => {
			const signature = await Effect.runPromise(
				Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any),
			);

			const recovered = await Effect.runPromise(
				Secp256k1.recover(signature, testMessageHash),
			);

			expect(recovered.length).toBe(64);

			const expected = VoltaireSecp256k1.derivePublicKey(
				testPrivateKeyBytes as any,
			);
			expect(recovered).toEqual(expected);
		});

		it("fails with invalid v value", async () => {
			const badSignature = {
				r: Hash.from(new Uint8Array(32).fill(1)),
				s: Hash.from(new Uint8Array(32).fill(2)),
				v: 99,
			};

			const exit = await Effect.runPromiseExit(
				Secp256k1.recover(badSignature, testMessageHash),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});
	});

	describe("verify", () => {
		it("verifies a valid signature", async () => {
			const signature = await Effect.runPromise(
				Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any),
			);
			const publicKey = VoltaireSecp256k1.derivePublicKey(
				testPrivateKeyBytes as any,
			);

			const isValid = await Effect.runPromise(
				Secp256k1.verify(signature, testMessageHash, publicKey),
			);

			expect(isValid).toBe(true);
		});

		it("returns false for wrong message hash", async () => {
			const signature = await Effect.runPromise(
				Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any),
			);
			const publicKey = VoltaireSecp256k1.derivePublicKey(
				testPrivateKeyBytes as any,
			);
			const wrongHash = Hash.from(new Uint8Array(32).fill(0xff));

			const isValid = await Effect.runPromise(
				Secp256k1.verify(signature, wrongHash, publicKey),
			);

			expect(isValid).toBe(false);
		});

		it("returns false for wrong public key", async () => {
			const signature = await Effect.runPromise(
				Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any),
			);
			const otherKey = new Uint8Array(32).fill(0x42);
			const wrongPublicKey = VoltaireSecp256k1.derivePublicKey(otherKey as any);

			const isValid = await Effect.runPromise(
				Secp256k1.verify(signature, testMessageHash, wrongPublicKey),
			);

			expect(isValid).toBe(false);
		});
	});

	describe("Known Vector Tests", () => {
		const bytesToHex = (bytes: Uint8Array): string => {
			return (
				"0x" +
				Array.from(bytes)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")
			);
		};

		it("sign/recover round-trip with known key", async () => {
			// Well-known test private key (from Ethereum test vectors)
			const privateKey = new Uint8Array([
				0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3, 0x6b, 0xa4, 0xa6, 0xb4,
				0xd2, 0x38, 0xff, 0x94, 0x4b, 0xac, 0xb4, 0x78, 0xcb, 0xed, 0x5e, 0xfc,
				0xae, 0x78, 0x4d, 0x7b, 0xf4, 0xf2, 0xff, 0x80,
			]);

			// keccak256("test message")
			const messageHashBytes = new Uint8Array([
				0x37, 0xbf, 0xc9, 0xe4, 0x00, 0xce, 0xa0, 0x40, 0x7f, 0x4d, 0xdc, 0xfc,
				0x6e, 0x29, 0x35, 0xf5, 0x1c, 0x8e, 0x7c, 0x03, 0xd3, 0xd4, 0x7c, 0xf1,
				0xf6, 0x02, 0x2c, 0x58, 0x50, 0x37, 0x6c, 0xd8,
			]);
			const messageHash = Hash.from(messageHashBytes);

			const sig = await Effect.runPromise(
				Secp256k1.sign(messageHash, privateKey as any),
			);

			const recovered = await Effect.runPromise(
				Secp256k1.recover(sig, messageHash),
			);

			const expected = VoltaireSecp256k1.derivePublicKey(privateKey as any);
			expect(recovered).toEqual(expected);
			expect(recovered.length).toBe(64);
		});

		it("derives correct public key from known private key", async () => {
			// Anvil's first account private key
			const privateKey = new Uint8Array([
				0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3, 0x6b, 0xa4, 0xa6, 0xb4,
				0xd2, 0x38, 0xff, 0x94, 0x4b, 0xac, 0xb4, 0x78, 0xcb, 0xed, 0x5e, 0xfc,
				0xae, 0x78, 0x4d, 0x7b, 0xf4, 0xf2, 0xff, 0x80,
			]);

			const publicKey = VoltaireSecp256k1.derivePublicKey(privateKey as any);

			// Expected public key for this well-known private key (uncompressed, without 04 prefix)
			expect(publicKey.length).toBe(64);
			// First byte of X coordinate
			expect(publicKey[0]).toBe(0x83);
		});

		it("produces deterministic signatures (RFC 6979)", async () => {
			const privateKey = new Uint8Array([
				0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c,
				0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18,
				0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20,
			]);
			const messageHash = Hash.from(new Uint8Array(32).fill(0xab));

			const sig1 = await Effect.runPromise(
				Secp256k1.sign(messageHash, privateKey as any),
			);
			const sig2 = await Effect.runPromise(
				Secp256k1.sign(messageHash, privateKey as any),
			);

			expect(bytesToHex(sig1.r as Uint8Array)).toBe(
				bytesToHex(sig2.r as Uint8Array),
			);
			expect(bytesToHex(sig1.s as Uint8Array)).toBe(
				bytesToHex(sig2.s as Uint8Array),
			);
			expect(sig1.v).toBe(sig2.v);
		});
	});

	describe("Secp256k1Service", () => {
		it("provides sign through service layer", async () => {
			const program = Effect.gen(function* () {
				const secp = yield* Secp256k1.Secp256k1Service;
				return yield* secp.sign(testMessageHash, testPrivateKeyBytes as any);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(Secp256k1.Secp256k1Live)),
			);

			expect(result).toHaveProperty("r");
			expect(result).toHaveProperty("s");
			expect(result).toHaveProperty("v");
		});

		it("provides recover through service layer", async () => {
			const signature = await Effect.runPromise(
				Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any),
			);

			const program = Effect.gen(function* () {
				const secp = yield* Secp256k1.Secp256k1Service;
				return yield* secp.recover(signature, testMessageHash);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(Secp256k1.Secp256k1Live)),
			);

			expect(result.length).toBe(64);
		});

		it("provides verify through service layer", async () => {
			const signature = await Effect.runPromise(
				Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any),
			);
			const publicKey = VoltaireSecp256k1.derivePublicKey(
				testPrivateKeyBytes as any,
			);

			const program = Effect.gen(function* () {
				const secp = yield* Secp256k1.Secp256k1Service;
				return yield* secp.verify(signature, testMessageHash, publicKey);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(Secp256k1.Secp256k1Live)),
			);

			expect(result).toBe(true);
		});
	});
});
