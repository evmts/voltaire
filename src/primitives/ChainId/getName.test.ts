import { describe, expect, it } from "vitest";
import * as ChainId from "./index.js";

describe("getName", () => {
	it("returns name for mainnet", () => {
		expect(ChainId.getName(1)).toBe("Mainnet");
	});

	it("returns names for all known chains", () => {
		expect(ChainId.getName(ChainId.MAINNET)).toBe("Mainnet");
		expect(ChainId.getName(ChainId.GOERLI)).toBe("Goerli");
		expect(ChainId.getName(ChainId.SEPOLIA)).toBe("Sepolia");
		expect(ChainId.getName(ChainId.HOLESKY)).toBe("Holesky");
		expect(ChainId.getName(ChainId.OPTIMISM)).toBe("Optimism");
		expect(ChainId.getName(ChainId.ARBITRUM)).toBe("Arbitrum One");
		expect(ChainId.getName(ChainId.BASE)).toBe("Base");
		expect(ChainId.getName(ChainId.POLYGON)).toBe("Polygon");
	});

	it("returns undefined for unknown chain IDs", () => {
		expect(ChainId.getName(999999)).toBeUndefined();
		expect(ChainId.getName(12345)).toBeUndefined();
		expect(ChainId.getName(0)).toBeUndefined();
	});

	it("works with internal function", () => {
		const chainId = ChainId.from(137);
		expect(ChainId._getName.call(chainId)).toBe("Polygon");
	});
});
