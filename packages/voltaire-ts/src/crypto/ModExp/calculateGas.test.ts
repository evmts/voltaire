import { describe, expect, it } from "vitest";
import { Precompile } from "../../primitives/GasConstants/index.js";
import * as Hardfork from "../../primitives/Hardfork/index.js";
import { calculateGas } from "./ModExp.js";

describe("ModExp fork pricing", () => {
	for (const calculate of [calculateGas, Precompile.calculateModExpCost]) {
		it("matches historical and Osaka costs at word and exponent boundaries", () => {
			const head = (1n << 256n) - 1n;
			expect(calculate(32n, 32n, 32n, head, Hardfork.BYZANTIUM)).toBe(13056n);
			expect(calculate(64n, 32n, 64n, head, Hardfork.BYZANTIUM)).toBe(52224n);
			expect(calculate(65n, 32n, 65n, head, Hardfork.BYZANTIUM)).toBe(53856n);
			expect(calculate(1024n, 32n, 1024n, head, Hardfork.BYZANTIUM)).toBe(
				4556544n,
			);
			expect(calculate(1025n, 32n, 1025n, head, Hardfork.BYZANTIUM)).toBe(
				4564296n,
			);
			expect(calculate(32n, 32n, 32n, head, Hardfork.PRAGUE)).toBe(1360n);
			expect(calculate(32n, 32n, 32n, head)).toBe(1360n);
			expect(calculate(32n, 32n, 32n, head, Hardfork.OSAKA)).toBe(4080n);
			expect(calculate(33n, 32n, 33n, head, Hardfork.OSAKA)).toBe(12750n);
			expect(calculate(64n, 33n, 64n, 0n, Hardfork.OSAKA)).toBe(2048n);
			expect(calculate(64n, 33n, 64n, head, Hardfork.OSAKA)).toBe(34688n);
			expect(calculate(0n, 1024n, 0n, 0n, Hardfork.OSAKA)).toBe(253952n);
			expect(calculate(0n, 0n, 0n, 0n, Hardfork.OSAKA)).toBe(500n);
		});
	}
});
