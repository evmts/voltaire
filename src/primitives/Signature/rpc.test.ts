import { describe, expect, it } from "vitest";
import { fromRpc } from "./fromRpc.js";
import { toRpc } from "./toRpc.js";
import { fromSecp256k1 } from "./fromSecp256k1.js";

describe("Signature RPC format", () => {
	const r = new Uint8Array(32).fill(0);
	r[31] = 0x12;
	const s = new Uint8Array(32).fill(0);
	s[31] = 0x34;

	describe("toRpc", () => {
		it("converts signature to RPC format", () => {
			const sig = fromSecp256k1(r, s, 27);
			const rpc = toRpc(sig);

			expect(rpc.r).toBe(
				"0x0000000000000000000000000000000000000000000000000000000000000012",
			);
			expect(rpc.s).toBe(
				"0x0000000000000000000000000000000000000000000000000000000000000034",
			);
			expect(rpc.yParity).toBe("0x0");
			expect(rpc.v).toBe("0x1b");
		});

		it("handles EIP-155 v values", () => {
			const sig = fromSecp256k1(r, s, 37); // chainId=1, yParity=0
			const rpc = toRpc(sig);
			expect(rpc.yParity).toBe("0x0");
			expect(rpc.v).toBe("0x25");
		});

		it("throws for non-secp256k1 signatures", () => {
			const ed25519Sig = {
				algorithm: "ed25519",
				0: 1,
				length: 64,
			};
			expect(() => toRpc(ed25519Sig as any)).toThrow(/only supports secp256k1/);
		});
	});

	describe("fromRpc", () => {
		it("parses RPC format signature", () => {
			const rpc = {
				r: "0x12",
				s: "0x34",
				yParity: "0x0",
			};
			const sig = fromRpc(rpc);

			expect(sig.algorithm).toBe("secp256k1");
			expect(sig.v).toBe(27);
		});

		it("parses with explicit v", () => {
			const rpc = {
				r: "0x12",
				s: "0x34",
				v: "0x25", // EIP-155 v=37
			};
			const sig = fromRpc(rpc);
			expect(sig.v).toBe(37);
		});

		it("pads r and s to 32 bytes", () => {
			const rpc = {
				r: "0x12",
				s: "0x34",
				yParity: "0x1",
			};
			const sig = fromRpc(rpc);
			expect(sig.slice(0, 32).length).toBe(32);
			expect(sig.slice(32, 64).length).toBe(32);
		});
	});

	describe("round-trip", () => {
		it("round-trips signature through RPC format", () => {
			const original = fromSecp256k1(r, s, 28);
			const rpc = toRpc(original);
			const restored = fromRpc(rpc);

			expect(restored.algorithm).toBe(original.algorithm);
			expect(restored.v).toBe(original.v);
			expect(restored.slice(0, 32)).toEqual(original.slice(0, 32));
			expect(restored.slice(32, 64)).toEqual(original.slice(32, 64));
		});
	});
});
