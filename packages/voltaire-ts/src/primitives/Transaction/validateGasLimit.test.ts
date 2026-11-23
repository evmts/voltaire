import { describe, expect, it } from "vitest";
import { CANCUN, OSAKA, PRAGUE } from "../Hardfork/constants.js";
import { exceedsTxGasLimit, MAX_TX_GAS_LIMIT } from "./exceedsTxGasLimit.js";
import * as Transaction from "./Transaction.js";
import { Type } from "./types.js";

const tx = (gasLimit: bigint): Transaction.Legacy => ({
	type: Type.Legacy,
	nonce: 0n,
	gasPrice: 1n,
	gasLimit,
	to: null,
	value: 0n,
	data: new Uint8Array(),
	v: 27n,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
});

describe("EIP-7825 transaction gas limit cap", () => {
	it("cap is 2^24", () => {
		expect(MAX_TX_GAS_LIMIT).toBe(2n ** 24n);
	});

	it("exceedsTxGasLimit applies from Osaka only", () => {
		expect(exceedsTxGasLimit(tx(MAX_TX_GAS_LIMIT), OSAKA)).toBe(false);
		expect(exceedsTxGasLimit(tx(MAX_TX_GAS_LIMIT + 1n), OSAKA)).toBe(true);
		expect(exceedsTxGasLimit(tx(MAX_TX_GAS_LIMIT + 1n), PRAGUE)).toBe(false);
		expect(Transaction.exceedsTxGasLimit(tx(30_000_000n), OSAKA)).toBe(true);
	});

	it("validateGasLimit defaults to Osaka and enforces the cap", () => {
		expect(() =>
			Transaction.validateGasLimit(tx(MAX_TX_GAS_LIMIT)),
		).not.toThrow();
		expect(() =>
			Transaction.validateGasLimit(tx(MAX_TX_GAS_LIMIT + 1n)),
		).toThrow("EIP-7825");
		expect(() =>
			Transaction.validateGasLimit(tx(MAX_TX_GAS_LIMIT + 1n), {
				hardfork: OSAKA,
			}),
		).toThrow("Gas limit exceeds maximum");
	});

	it("pre-Osaka has no per-transaction cap, only the block gas limit", () => {
		expect(() =>
			Transaction.validateGasLimit(tx(36_000_000n), { hardfork: PRAGUE }),
		).not.toThrow();
		expect(() =>
			Transaction.validateGasLimit(tx(36_000_000n), {
				hardfork: CANCUN,
				blockGasLimit: 36_000_000n,
			}),
		).not.toThrow();
		expect(() =>
			Transaction.validateGasLimit(tx(36_000_001n), {
				hardfork: CANCUN,
				blockGasLimit: 36_000_000n,
			}),
		).toThrow("block gas limit");
	});

	it("Osaka also enforces a smaller block gas limit", () => {
		expect(() =>
			Transaction.validateGasLimit(tx(1_000_001n), {
				hardfork: OSAKA,
				blockGasLimit: 1_000_000n,
			}),
		).toThrow("block gas limit");
	});

	it("still rejects non-positive gas limits", () => {
		expect(() =>
			Transaction.validateGasLimit(tx(0n), { hardfork: PRAGUE }),
		).toThrow("Gas limit must be positive");
	});
});
