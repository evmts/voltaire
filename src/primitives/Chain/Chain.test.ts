import { describe, expect, test } from "bun:test";
import { Chain } from "./Chain.js";

describe("Chain.from", () => {
	test("identity function returns same chain", () => {
		const quai = Chain.fromId(9)!;
		const result = Chain.from(quai);
		expect(result).toBe(quai);
		expect(result.chainId).toBe(9);
	});

	test("works with Chain constructor", () => {
		const quai = Chain.fromId(9)!;
		const result = Chain(quai);
		expect(result).toBe(quai);
		expect(result.chainId).toBe(9);
	});
});

describe("Chain.fromId", () => {
	test("returns quai for chainId 9", () => {
		const result = Chain.fromId(9);
		expect(result?.chainId).toBe(9);
		expect(result?.name).toBe("Quai Mainnet");
	});

	test("returns flare for chainId 14", () => {
		const result = Chain.fromId(14);
		expect(result?.chainId).toBe(14);
		expect(result?.name).toBe("Flare Mainnet");
	});

	test("returns undefined for invalid chainId", () => {
		const result = Chain.fromId(999999999);
		expect(result).toBeUndefined();
	});
});

describe("Chain.byId", () => {
	test("quai accessible via byId[9]", () => {
		const chain = Chain.byId[9];
		expect(chain?.chainId).toBe(9);
		expect(chain?.name).toBe("Quai Mainnet");
	});

	test("flare accessible via byId[14]", () => {
		const chain = Chain.byId[14];
		expect(chain?.chainId).toBe(14);
		expect(chain?.name).toBe("Flare Mainnet");
	});

	test("invalid chainId returns undefined", () => {
		const chain = Chain.byId[999999999];
		expect(chain).toBeUndefined();
	});
});
