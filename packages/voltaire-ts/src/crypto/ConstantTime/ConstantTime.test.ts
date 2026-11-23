import { describe, expect, it } from "vitest";
import {
	ConstantTime,
	constantTimeEqual,
	constantTimeIsValidScalar,
	constantTimeIsZero,
} from "./index.js";

describe("ConstantTime", () => {
	describe("constantTimeEqual", () => {
		it("returns true for equal arrays", () => {
			const a = new Uint8Array([1, 2, 3, 4]);
			expect(constantTimeEqual(a, new Uint8Array([1, 2, 3, 4]))).toBe(true);
			expect(constantTimeEqual(a, a)).toBe(true);
		});

		it("returns true for two empty arrays", () => {
			expect(constantTimeEqual(new Uint8Array(0), new Uint8Array(0))).toBe(
				true,
			);
		});

		it("returns false for different lengths, including prefixes", () => {
			const a = new Uint8Array([1, 2, 3]);
			expect(constantTimeEqual(a, new Uint8Array([1, 2, 3, 0]))).toBe(false);
			expect(constantTimeEqual(a, new Uint8Array([1, 2]))).toBe(false);
			expect(constantTimeEqual(a, new Uint8Array(0))).toBe(false);
		});

		it("detects a single flipped bit at every position", () => {
			const a = crypto.getRandomValues(new Uint8Array(32));
			for (let i = 0; i < a.length; i++) {
				for (let bit = 0; bit < 8; bit++) {
					const b = a.slice();
					b[i] = (b[i] as number) ^ (1 << bit);
					expect(constantTimeEqual(a, b)).toBe(false);
				}
			}
		});

		it("does not let differences cancel out", () => {
			// 0x01 ^ 0x03 = 0x02 twice: an XOR-fold accumulator would report equal
			const a = new Uint8Array([0x01, 0x01]);
			const b = new Uint8Array([0x03, 0x03]);
			expect(constantTimeEqual(a, b)).toBe(false);
		});

		it("reads every byte with no early exit", () => {
			const reads: number[] = [];
			const tracked = (bytes: Uint8Array) =>
				new Proxy(bytes, {
					get(target, prop) {
						if (typeof prop === "string" && /^\d+$/.test(prop)) {
							reads.push(Number(prop));
						}
						return Reflect.get(target, prop);
					},
				});
			const a = new Uint8Array(16).fill(0xaa);
			const b = new Uint8Array(16).fill(0xaa);
			b[0] = 0x55; // differs at the first byte

			expect(constantTimeEqual(tracked(a), b)).toBe(false);
			expect(reads).toEqual(Array.from({ length: 16 }, (_, i) => i));
		});
	});

	describe("constantTimeIsZero", () => {
		it("returns true for all-zero and empty input", () => {
			expect(constantTimeIsZero(new Uint8Array(32))).toBe(true);
			expect(constantTimeIsZero(new Uint8Array(0))).toBe(true);
		});

		it("returns false when any single byte is non-zero", () => {
			for (let i = 0; i < 32; i++) {
				const bytes = new Uint8Array(32);
				bytes[i] = 1;
				expect(constantTimeIsZero(bytes)).toBe(false);
			}
		});

		it("reads every byte with no early exit", () => {
			const reads: number[] = [];
			const bytes = new Uint8Array(8);
			bytes[0] = 0xff;
			const tracked = new Proxy(bytes, {
				get(target, prop) {
					if (typeof prop === "string" && /^\d+$/.test(prop)) {
						reads.push(Number(prop));
					}
					return Reflect.get(target, prop);
				},
			});
			expect(constantTimeIsZero(tracked)).toBe(false);
			expect(reads).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
		});
	});

	describe("constantTimeIsValidScalar", () => {
		const order = new Uint8Array([0x00, 0x10, 0x00, 0x05]);

		it("accepts values in [1, upperBound - 1]", () => {
			expect(
				constantTimeIsValidScalar(
					new Uint8Array([0x00, 0x00, 0x00, 0x01]),
					order,
				),
			).toBe(true);
			expect(
				constantTimeIsValidScalar(
					new Uint8Array([0x00, 0x10, 0x00, 0x04]),
					order,
				),
			).toBe(true);
			expect(
				constantTimeIsValidScalar(
					new Uint8Array([0x00, 0x0f, 0xff, 0xff]),
					order,
				),
			).toBe(true);
		});

		it("rejects zero, upperBound, values > upperBound, and mismatched lengths", () => {
			expect(constantTimeIsValidScalar(new Uint8Array(4), order)).toBe(false);
			expect(constantTimeIsValidScalar(order.slice(), order)).toBe(false);
			expect(
				constantTimeIsValidScalar(
					new Uint8Array([0x00, 0x10, 0x00, 0x06]),
					order,
				),
			).toBe(false);
			expect(
				constantTimeIsValidScalar(new Uint8Array(4).fill(0xff), order),
			).toBe(false);
			expect(constantTimeIsValidScalar(new Uint8Array(3), order)).toBe(false);
			expect(
				constantTimeIsValidScalar(new Uint8Array(0), new Uint8Array(0)),
			).toBe(false);
		});

		it("reads every byte with no early exit", () => {
			const reads: number[] = [];
			const scalar = new Uint8Array([0xff, 0x00, 0x00, 0x01]);
			const tracked = new Proxy(scalar, {
				get(target, prop) {
					if (typeof prop === "string" && /^\d+$/.test(prop)) {
						reads.push(Number(prop));
					}
					return Reflect.get(target, prop);
				},
			});
			expect(constantTimeIsValidScalar(tracked, order)).toBe(false);
			expect(reads).toEqual([3, 2, 1, 0]);
		});
	});

	describe("namespace", () => {
		it("exposes the helpers and short aliases", () => {
			expect(ConstantTime.constantTimeEqual).toBe(constantTimeEqual);
			expect(ConstantTime.constantTimeIsValidScalar).toBe(
				constantTimeIsValidScalar,
			);
			expect(ConstantTime.constantTimeIsZero).toBe(constantTimeIsZero);
			expect(ConstantTime.equal).toBe(constantTimeEqual);
			expect(ConstantTime.isValidScalar).toBe(constantTimeIsValidScalar);
			expect(ConstantTime.isZero).toBe(constantTimeIsZero);
		});
	});
});
