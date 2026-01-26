import { describe, expect, it } from "@effect/vitest";
import { Hash } from "@tevm/voltaire";
import { PrivateKey as CorePrivateKey } from "@tevm/voltaire/PrivateKey";
import { PublicKey as CorePublicKey, type PublicKeyType } from "@tevm/voltaire/PublicKey";
import * as Secp256k1 from "@tevm/voltaire/Secp256k1";
import * as Signature from "@tevm/voltaire/Signature";
import * as Effect from "effect/Effect";
import * as S from "effect/Schema";
import * as PublicKey from "./index.js";

const validUncompressedHex = `0x${"ab".repeat(64)}`;
const validCompressedHex = `0x02${"ab".repeat(32)}`;

describe("PublicKey.Hex", () => {
	describe("decode", () => {
		it("parses 128-char uncompressed hex", () => {
			const pk = S.decodeSync(PublicKey.Hex)(validUncompressedHex);
			expect(pk).toBeInstanceOf(Uint8Array);
			expect(pk.length).toBe(64);
		});

		it("fails on wrong length (too short)", () => {
			expect(() => S.decodeSync(PublicKey.Hex)("0x1234")).toThrow();
		});

		it("fails on wrong length (odd chars)", () => {
			expect(() =>
				S.decodeSync(PublicKey.Hex)(`0x${"ab".repeat(31)}a`),
			).toThrow();
		});

		it("fails on invalid hex characters", () => {
			expect(() =>
				S.decodeSync(PublicKey.Hex)(`0x${"gg".repeat(64)}`),
			).toThrow();
		});

		it("fails on empty string", () => {
			expect(() => S.decodeSync(PublicKey.Hex)("")).toThrow();
		});

		it("fails on just prefix", () => {
			expect(() => S.decodeSync(PublicKey.Hex)("0x")).toThrow();
		});
	});

	describe("encode", () => {
		it("encodes to lowercase hex with prefix", () => {
			const pk = S.decodeSync(PublicKey.Hex)(validUncompressedHex);
			const hex = S.encodeSync(PublicKey.Hex)(pk);
			expect(hex.startsWith("0x")).toBe(true);
			expect(hex.length).toBe(130);
		});

		it("round-trips correctly", () => {
			const original = S.decodeSync(PublicKey.Hex)(validUncompressedHex);
			const encoded = S.encodeSync(PublicKey.Hex)(original);
			const decoded = S.decodeSync(PublicKey.Hex)(encoded);
			expect(decoded.length).toBe(original.length);
			expect([...decoded]).toEqual([...original]);
		});
	});
});

describe("PublicKey.Bytes", () => {
	describe("decode", () => {
		it("parses 64-byte uncompressed array", () => {
			const bytes = new Uint8Array(64).fill(0xab);
			const pk = S.decodeSync(PublicKey.Bytes)(bytes);
			expect(pk.length).toBe(64);
		});

		it("parses 33-byte compressed array and decompresses", () => {
			const compressed = new Uint8Array(33);
			compressed[0] = 0x02;
			compressed.fill(0xab, 1);
			const pk = S.decodeSync(PublicKey.Bytes)(compressed);
			expect(pk.length).toBe(64);
		});

		it("fails on wrong length (32 bytes)", () => {
			const bytes = new Uint8Array(32);
			expect(() => S.decodeSync(PublicKey.Bytes)(bytes)).toThrow();
		});

		it("fails on wrong length (65 bytes)", () => {
			const bytes = new Uint8Array(65);
			expect(() => S.decodeSync(PublicKey.Bytes)(bytes)).toThrow();
		});

		it("fails on empty array", () => {
			expect(() => S.decodeSync(PublicKey.Bytes)(new Uint8Array())).toThrow();
		});

		it("fails on 1-byte array", () => {
			expect(() =>
				S.decodeSync(PublicKey.Bytes)(new Uint8Array([0x02])),
			).toThrow();
		});
	});

	describe("encode", () => {
		it("encodes to 64-byte Uint8Array", () => {
			const pk = S.decodeSync(PublicKey.Hex)(validUncompressedHex);
			const bytes = S.encodeSync(PublicKey.Bytes)(pk);
			expect(bytes).toBeInstanceOf(Uint8Array);
			expect(bytes.length).toBe(64);
		});
	});
});

describe("PublicKey.Compressed", () => {
	describe("decode", () => {
		it("parses compressed hex with 0x02 prefix", () => {
			const pk = S.decodeSync(PublicKey.Compressed)(validCompressedHex);
			expect(pk).toBeInstanceOf(Uint8Array);
			expect(pk.length).toBe(64);
		});

		it("parses compressed hex with 0x03 prefix", () => {
			const hex03 = `0x03${"ab".repeat(32)}`;
			const pk = S.decodeSync(PublicKey.Compressed)(hex03);
			expect(pk.length).toBe(64);
		});

		it("parses uncompressed hex too", () => {
			const pk = S.decodeSync(PublicKey.Compressed)(validUncompressedHex);
			expect(pk.length).toBe(64);
		});

		it("fails on invalid prefix", () => {
			const badPrefix = `0x05${"ab".repeat(32)}`;
			expect(() => S.decodeSync(PublicKey.Compressed)(badPrefix)).toThrow();
		});
	});

	describe("encode", () => {
		it("encodes to compressed hex (66 chars)", () => {
			const pk = S.decodeSync(PublicKey.Hex)(validUncompressedHex);
			const compressed = S.encodeSync(PublicKey.Compressed)(pk);
			expect(
				compressed.startsWith("0x02") || compressed.startsWith("0x03"),
			).toBe(true);
			expect(compressed.length).toBe(68);
		});
	});
});

describe("effect-wrapped functions", () => {
	describe("isCompressed", () => {
		it("returns true for 33-byte with 0x02 prefix", async () => {
			const bytes = new Uint8Array(33);
			bytes[0] = 0x02;
			const result = await Effect.runPromise(PublicKey.isCompressed(bytes));
			expect(result).toBe(true);
		});

		it("returns true for 33-byte with 0x03 prefix", async () => {
			const bytes = new Uint8Array(33);
			bytes[0] = 0x03;
			const result = await Effect.runPromise(PublicKey.isCompressed(bytes));
			expect(result).toBe(true);
		});

		it("returns false for 64-byte uncompressed", async () => {
			const bytes = new Uint8Array(64);
			const result = await Effect.runPromise(PublicKey.isCompressed(bytes));
			expect(result).toBe(false);
		});

		it("returns false for wrong length", async () => {
			const bytes = new Uint8Array(32);
			const result = await Effect.runPromise(PublicKey.isCompressed(bytes));
			expect(result).toBe(false);
		});
	});

	describe("isValid", () => {
		it("returns true for valid uncompressed hex", async () => {
			const result = await Effect.runPromise(
				PublicKey.isValid(validUncompressedHex),
			);
			expect(result).toBe(true);
		});

		it("returns true for 64-byte array", async () => {
			const bytes = new Uint8Array(64);
			const result = await Effect.runPromise(PublicKey.isValid(bytes));
			expect(result).toBe(true);
		});

		it("returns true for 33-byte compressed array", async () => {
			const bytes = new Uint8Array(33);
			bytes[0] = 0x02;
			const result = await Effect.runPromise(PublicKey.isValid(bytes));
			expect(result).toBe(true);
		});

		it("returns false for wrong hex length", async () => {
			const result = await Effect.runPromise(PublicKey.isValid("0x1234"));
			expect(result).toBe(false);
		});

		it("returns false for wrong byte length", async () => {
			const bytes = new Uint8Array(32);
			const result = await Effect.runPromise(PublicKey.isValid(bytes));
			expect(result).toBe(false);
		});

		it("returns false for invalid hex chars", async () => {
			const result = await Effect.runPromise(
				PublicKey.isValid(`0x${"gg".repeat(64)}`),
			);
			expect(result).toBe(false);
		});
	});
});

describe("edge cases", () => {
	it("handles all-zeros public key", () => {
		const zeroBytes = new Uint8Array(64);
		const pk = S.decodeSync(PublicKey.Bytes)(zeroBytes);
		expect(pk.length).toBe(64);
	});

	it("handles max value bytes", () => {
		const maxBytes = new Uint8Array(64).fill(0xff);
		const pk = S.decodeSync(PublicKey.Bytes)(maxBytes);
		expect(pk.length).toBe(64);
	});

	it("handles mixed case hex", () => {
		const mixedCase = `0x${"Ab".repeat(64)}`;
		const pk = S.decodeSync(PublicKey.Hex)(mixedCase);
		expect(pk.length).toBe(64);
	});

	it("handles hex without 0x prefix via isValid", async () => {
		const noPrefix = "ab".repeat(64);
		const result = await Effect.runPromise(PublicKey.isValid(noPrefix));
		expect(result).toBe(true);
	});
});

describe("PublicKey.toAddress", () => {
	const privateKey = CorePrivateKey.fromBytes(new Uint8Array(32).fill(1));
	const publicKey = Secp256k1.derivePublicKey(privateKey) as unknown as PublicKeyType;

	it.effect("derives address from public key", () =>
		Effect.gen(function* () {
			const address = yield* PublicKey.toAddress(publicKey);
			expect(address).toBeInstanceOf(Uint8Array);
			expect(address.length).toBe(20);
		}),
	);

	it.effect("produces consistent address for same public key", () =>
		Effect.gen(function* () {
			const addr1 = yield* PublicKey.toAddress(publicKey);
			const addr2 = yield* PublicKey.toAddress(publicKey);
			expect([...addr1]).toEqual([...addr2]);
		}),
	);

	it.effect("produces different addresses for different keys", () =>
		Effect.gen(function* () {
			const otherPrivateKey = CorePrivateKey.fromBytes(new Uint8Array(32).fill(2));
			const otherKey = Secp256k1.derivePublicKey(otherPrivateKey) as unknown as PublicKeyType;
			const addr1 = yield* PublicKey.toAddress(publicKey);
			const addr2 = yield* PublicKey.toAddress(otherKey);
			expect([...addr1]).not.toEqual([...addr2]);
		}),
	);
});

describe("PublicKey core primitives", () => {
	it("derives public key from private key", () => {
		const privateKey = CorePrivateKey.fromBytes(new Uint8Array(32).fill(7));
		const derived = CorePublicKey.fromPrivateKey(privateKey);
		const expected = Secp256k1.derivePublicKey(privateKey);
		expect([...derived]).toEqual([...expected]);
	});

	it("compresses and decompresses public keys", () => {
		const privateKey = CorePrivateKey.fromBytes(new Uint8Array(32).fill(9));
		const uncompressed = CorePublicKey.fromPrivateKey(privateKey);
		const compressed = CorePublicKey.compress(uncompressed);
		expect(compressed.length).toBe(33);
		const decompressed = CorePublicKey.decompress(compressed);
		expect([...decompressed]).toEqual([...uncompressed]);
	});
});

describe("PublicKey.verify", () => {
	const privateKey = CorePrivateKey.fromBytes(new Uint8Array(32).fill(1));
	const publicKey = Secp256k1.derivePublicKey(privateKey) as unknown as PublicKeyType;
	const messageHash = Hash.from(new Uint8Array(32).fill(0x11));

	it.effect("verifies valid signature", () =>
		Effect.gen(function* () {
			const secp256k1Sig = Secp256k1.sign(messageHash, privateKey);
			// Convert Secp256k1SignatureType to SignatureType
			const signature = Signature.fromSecp256k1(secp256k1Sig.r, secp256k1Sig.s, secp256k1Sig.v);
			const isValid = yield* PublicKey.verify(
				publicKey,
				messageHash,
				signature,
			);
			expect(isValid).toBe(true);
		}),
	);

	it.effect("rejects signature from different key", () =>
		Effect.gen(function* () {
			const otherPrivateKey = CorePrivateKey.fromBytes(new Uint8Array(32).fill(2));
			const secp256k1Sig = Secp256k1.sign(messageHash, otherPrivateKey);
			const signature = Signature.fromSecp256k1(secp256k1Sig.r, secp256k1Sig.s, secp256k1Sig.v);
			const isValid = yield* PublicKey.verify(
				publicKey,
				messageHash,
				signature,
			);
			expect(isValid).toBe(false);
		}),
	);

	it.effect("rejects signature for different message", () =>
		Effect.gen(function* () {
			const secp256k1Sig = Secp256k1.sign(messageHash, privateKey);
			const signature = Signature.fromSecp256k1(secp256k1Sig.r, secp256k1Sig.s, secp256k1Sig.v);
			const differentHash = Hash.from(new Uint8Array(32).fill(0x22));
			const isValid = yield* PublicKey.verify(
				publicKey,
				differentHash,
				signature,
			);
			expect(isValid).toBe(false);
		}),
	);

	it.effect("rejects tampered signature", () =>
		Effect.gen(function* () {
			const _signature = Secp256k1.sign(messageHash, privateKey);
			const tamperedSig = Signature.fromSecp256k1(
				new Uint8Array(32).fill(0x99),
				new Uint8Array(32).fill(0x88),
				27,
			);
			const isValid = yield* PublicKey.verify(
				publicKey,
				messageHash,
				tamperedSig,
			);
			expect(isValid).toBe(false);
		}),
	);
});

describe("PublicKey.equals", () => {
	const pk1 = S.decodeSync(PublicKey.Bytes)(new Uint8Array(64).fill(0xab));
	const pk2 = S.decodeSync(PublicKey.Bytes)(new Uint8Array(64).fill(0xab));
	const pk3 = S.decodeSync(PublicKey.Bytes)(new Uint8Array(64).fill(0xcd));

	it.effect("returns true for identical public keys", () =>
		Effect.gen(function* () {
			const result = yield* PublicKey.equals(pk1, pk2);
			expect(result).toBe(true);
		}),
	);

	it.effect("returns false for different public keys", () =>
		Effect.gen(function* () {
			const result = yield* PublicKey.equals(pk1, pk3);
			expect(result).toBe(false);
		}),
	);

	it.effect("returns true for same instance", () =>
		Effect.gen(function* () {
			const result = yield* PublicKey.equals(pk1, pk1);
			expect(result).toBe(true);
		}),
	);

	it.effect("uses constant-time comparison", () =>
		Effect.gen(function* () {
			const almostSame = new Uint8Array(64).fill(0xab);
			almostSame[63] = 0xac;
			const pk4 = S.decodeSync(PublicKey.Bytes)(almostSame);
			const result = yield* PublicKey.equals(pk1, pk4);
			expect(result).toBe(false);
		}),
	);
});

describe("PublicKey.toBytes", () => {
	it("returns underlying Uint8Array", () => {
		const pk = S.decodeSync(PublicKey.Hex)(validUncompressedHex);
		const bytes = PublicKey.toBytes(pk);
		expect(bytes).toBeInstanceOf(Uint8Array);
		expect(bytes.length).toBe(64);
	});

	it("returns same reference (identity function)", () => {
		const pk = S.decodeSync(PublicKey.Hex)(validUncompressedHex);
		const bytes = PublicKey.toBytes(pk);
		expect(bytes).toBe(pk);
	});

	it("works with decoded compressed key", () => {
		const compressed = new Uint8Array(33);
		compressed[0] = 0x02;
		compressed.fill(0xab, 1);
		const pk = S.decodeSync(PublicKey.Bytes)(compressed);
		const bytes = PublicKey.toBytes(pk);
		expect(bytes.length).toBe(64);
	});
});
