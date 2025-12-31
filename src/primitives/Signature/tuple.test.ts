import { describe, expect, it } from "vitest";
import { fromSecp256k1 } from "./fromSecp256k1.js";
import { fromTuple } from "./fromTuple.js";
import { toTuple } from "./toTuple.js";

describe("Signature Tuple format", () => {
	const r = new Uint8Array(32).fill(0);
	r[31] = 0x12;
	const s = new Uint8Array(32).fill(0);
	s[31] = 0x34;

	describe("toTuple", () => {
		it("converts to [yParity, r, s] tuple", () => {
			const sig = fromSecp256k1(r, s, 27);
			const [yParity, rOut, sOut] = toTuple(sig);

			expect(yParity).toBe(0);
			expect(rOut).toEqual(r);
			expect(sOut).toEqual(s);
		});

		it("handles v=28 (yParity=1)", () => {
			const sig = fromSecp256k1(r, s, 28);
			const [yParity] = toTuple(sig);
			expect(yParity).toBe(1);
		});

		it("handles EIP-155 v values", () => {
			const sig = fromSecp256k1(r, s, 37); // chainId=1, yParity=0
			const [yParity] = toTuple(sig);
			expect(yParity).toBe(0);

			const sig2 = fromSecp256k1(r, s, 38); // chainId=1, yParity=1
			const [yParity2] = toTuple(sig2);
			expect(yParity2).toBe(1);
		});

		it("throws for signatures without v", () => {
			const sig = fromSecp256k1(r, s);
			expect(() => toTuple(sig)).toThrow(/must have v value/);
		});

		it("throws for non-secp256k1 signatures", () => {
			const ed25519Sig = {
				algorithm: "ed25519",
				v: 27,
			};
			// biome-ignore lint/suspicious/noExplicitAny: testing invalid input
			expect(() => toTuple(ed25519Sig as any)).toThrow(
				/only supports secp256k1/,
			);
		});
	});

	describe("fromTuple", () => {
		it("creates signature from tuple", () => {
			const sig = fromTuple([0, r, s]);
			expect(sig.algorithm).toBe("secp256k1");
			expect(sig.v).toBe(27);
		});

		it("handles yParity=1", () => {
			const sig = fromTuple([1, r, s]);
			expect(sig.v).toBe(28);
		});

		it("handles chainId for EIP-155", () => {
			const sig = fromTuple([0, r, s], 1);
			expect(sig.v).toBe(37); // 1*2 + 35 + 0

			const sig2 = fromTuple([1, r, s], 1);
			expect(sig2.v).toBe(38); // 1*2 + 35 + 1
		});

		it("handles large chainIds", () => {
			const sig = fromTuple([0, r, s], 137); // Polygon
			expect(sig.v).toBe(309); // 137*2 + 35 + 0
		});
	});

	describe("round-trip", () => {
		it("round-trips through tuple format", () => {
			const original = fromSecp256k1(r, s, 28);
			const tuple = toTuple(original);
			const restored = fromTuple(tuple);

			expect(restored.v).toBe(original.v);
			expect(restored.slice(0, 32)).toEqual(original.slice(0, 32));
			expect(restored.slice(32, 64)).toEqual(original.slice(32, 64));
		});
	});
});
