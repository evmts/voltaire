import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import * as Gas from "../../primitives/GasConstants/index.js";
import * as Hardfork from "../../primitives/Hardfork/index.js";
import {
	bls12G1Add,
	bls12G1Msm,
	bls12G2Add,
	bls12G2Msm,
	bls12MapFp2ToG2,
	bls12MapFpToG1,
	bls12Pairing,
	execute,
	PrecompileAddress,
	type PrecompileResult,
} from "./precompiles.js";

/**
 * Official EIP-2537 conformance vectors.
 *
 * `eip2537.vectors.json` is copied from
 * https://github.com/ethereum/EIPs/tree/master/assets/eip-2537
 * (add, msm, pairing_check, map and their fail- files). The MSM
 * `discount_table_k` vectors are stored as `[k, gas]` pairs in `msmGas`
 * because their inputs total 10 MB.
 */
type SuccessVector = {
	Name: string;
	Input: string;
	Expected: string;
	Gas: number;
};
type FailVector = { Name: string; Input: string; ExpectedError: string };
type Operation =
	| "g1Add"
	| "g1Msm"
	| "g2Add"
	| "g2Msm"
	| "pairing"
	| "mapFpToG1"
	| "mapFp2ToG2";
type Vectors = {
	success: Record<Operation, SuccessVector[]>;
	fail: Record<Operation, FailVector[]>;
	msmGas: { g1Msm: Array<[number, number]>; g2Msm: Array<[number, number]> };
};

const vectors = JSON.parse(
	readFileSync(new URL("./eip2537.vectors.json", import.meta.url), "utf8"),
) as Vectors;

const operations: Record<
	Operation,
	{
		address: string;
		run: (input: Uint8Array, gasLimit: bigint) => PrecompileResult;
	}
> = {
	g1Add: { address: PrecompileAddress.BLS12_G1_ADD, run: bls12G1Add },
	g1Msm: { address: PrecompileAddress.BLS12_G1_MSM, run: bls12G1Msm },
	g2Add: { address: PrecompileAddress.BLS12_G2_ADD, run: bls12G2Add },
	g2Msm: { address: PrecompileAddress.BLS12_G2_MSM, run: bls12G2Msm },
	pairing: { address: PrecompileAddress.BLS12_PAIRING, run: bls12Pairing },
	mapFpToG1: {
		address: PrecompileAddress.BLS12_MAP_FP_TO_G1,
		run: bls12MapFpToG1,
	},
	mapFp2ToG2: {
		address: PrecompileAddress.BLS12_MAP_FP2_TO_G2,
		run: bls12MapFp2ToG2,
	},
};

const fromHex = (hex: string) => Uint8Array.from(Buffer.from(hex, "hex"));
const toHex = (bytes: Uint8Array) => Buffer.from(bytes).toString("hex");
const names = Object.keys(operations) as Operation[];

describe("EIP-2537 official vectors", () => {
	test("the fixture holds every expected vector set", () => {
		const counts = (set: Record<Operation, unknown[]>) =>
			Object.fromEntries(names.map((name) => [name, set[name].length]));
		expect(counts(vectors.success)).toEqual({
			g1Add: 9,
			g1Msm: 14,
			g2Add: 9,
			g2Msm: 15,
			pairing: 15,
			mapFpToG1: 5,
			mapFp2ToG2: 5,
		});
		expect(counts(vectors.fail)).toEqual({
			g1Add: 7,
			g1Msm: 8,
			g2Add: 7,
			g2Msm: 8,
			pairing: 25,
			mapFpToG1: 5,
			mapFp2ToG2: 5,
		});
		expect(vectors.msmGas.g1Msm.length).toBe(149);
		expect(vectors.msmGas.g2Msm.length).toBe(149);
	});

	for (const name of names) {
		const { address, run } = operations[name];

		describe(`${name} success vectors`, () => {
			for (const vector of vectors.success[name]) {
				test(vector.Name, () => {
					const input = fromHex(vector.Input);
					const gas = BigInt(vector.Gas);

					// Exact gas: succeeds, charges the vector gas, returns Expected.
					const result = run(input, gas);
					expect(result.error).toBeUndefined();
					expect(result.success).toBe(true);
					expect(result.gasUsed).toBe(gas);
					expect(toHex(result.output)).toBe(vector.Expected);

					// One gas short: out of gas, all forwarded gas consumed.
					const short = run(input, gas - 1n);
					expect(short.success).toBe(false);
					expect(short.gasUsed).toBe(gas - 1n);
					expect(short.output.length).toBe(0);

					// Same result through execute at the final address.
					for (const fork of [Hardfork.PRAGUE, Hardfork.OSAKA]) {
						const viaExecute = execute(address, input, gas, fork);
						expect(viaExecute.success).toBe(true);
						expect(viaExecute.gasUsed).toBe(gas);
						expect(toHex(viaExecute.output)).toBe(vector.Expected);
					}
				});
			}
		});

		describe(`${name} fail vectors`, () => {
			for (const vector of vectors.fail[name]) {
				test(`${vector.Name} (${vector.ExpectedError})`, () => {
					const input = fromHex(vector.Input);
					const gasLimit = 10_000_000n;
					for (const result of [
						run(input, gasLimit),
						execute(address, input, gasLimit, Hardfork.PRAGUE),
					]) {
						expect(result.success).toBe(false);
						expect(result.error).toBeDefined();
						// "all the gas supplied ... is burned"
						expect(result.gasUsed).toBe(gasLimit);
						expect(result.output.length).toBe(0);
					}
				});
			}
		});
	}

	test("G1 MSM gas matches every discount_table vector (k = 1..149)", () => {
		for (const [k, gas] of vectors.msmGas.g1Msm) {
			expect(Gas.Precompile.calculateBls12G1MsmCost(BigInt(k))).toBe(
				BigInt(gas),
			);
		}
	});

	test("G2 MSM gas matches every discount_table vector (k = 1..149)", () => {
		for (const [k, gas] of vectors.msmGas.g2Msm) {
			expect(Gas.Precompile.calculateBls12G2MsmCost(BigInt(k))).toBe(
				BigInt(gas),
			);
		}
	});

	test("the precompiles charge the discount_table gas for k pairs of infinity", () => {
		for (const [k, gas] of vectors.msmGas.g1Msm) {
			if (k > 16 && k !== 128 && k !== 129 && k !== 149) continue;
			const g1 = bls12G1Msm(new Uint8Array(160 * k), 10_000_000n);
			expect(g1.success).toBe(true);
			expect(g1.gasUsed).toBe(BigInt(gas));
		}
		for (const [k, gas] of vectors.msmGas.g2Msm) {
			if (k > 16 && k !== 128 && k !== 129 && k !== 149) continue;
			const g2 = bls12G2Msm(new Uint8Array(288 * k), 10_000_000n);
			expect(g2.success).toBe(true);
			expect(g2.gasUsed).toBe(BigInt(gas));
		}
	});
});
