import { describe, expect, it } from "vitest";
import {
	exceedsMaxRlpBlockSize,
	MAX_BLOCK_SIZE,
	MAX_RLP_BLOCK_SIZE,
	Rlp,
	SAFETY_MARGIN,
} from "./index.js";

describe("Rlp.exceedsMaxRlpBlockSize", () => {
	it("exports the EIP-7934 byte limits", () => {
		expect(MAX_BLOCK_SIZE).toBe(10_485_760);
		expect(SAFETY_MARGIN).toBe(2_097_152);
		expect(MAX_RLP_BLOCK_SIZE).toBe(8_388_608);
	});

	it("allows encoded bytes at or below the limit and rejects larger inputs", () => {
		const encoded = new Uint8Array(MAX_RLP_BLOCK_SIZE + 1);
		expect(exceedsMaxRlpBlockSize(encoded.subarray(0, 0))).toBe(false);
		expect(
			exceedsMaxRlpBlockSize(encoded.subarray(0, MAX_RLP_BLOCK_SIZE - 1)),
		).toBe(false);
		expect(
			exceedsMaxRlpBlockSize(encoded.subarray(0, MAX_RLP_BLOCK_SIZE)),
		).toBe(false);
		expect(exceedsMaxRlpBlockSize(encoded)).toBe(true);
		expect(Rlp.exceedsMaxRlpBlockSize(encoded)).toBe(true);
	});
});
