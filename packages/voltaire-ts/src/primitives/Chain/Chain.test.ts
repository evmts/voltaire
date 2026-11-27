import { describe, expect, test } from "vitest";
import { Chain } from "./Chain.js";

describe("Chain.from", () => {
	test("identity function returns same chain", () => {
		// biome-ignore lint/style/noNonNullAssertion: test assumes chain exists
		const mainnet = Chain.fromId(1)!;
		const result = Chain.from(mainnet);
		expect(result).toBe(mainnet);
		expect(result.chainId).toBe(1);
	});

	test("works with Chain constructor", () => {
		// biome-ignore lint/style/noNonNullAssertion: test assumes chain exists
		const mainnet = Chain.fromId(1)!;
		const result = Chain(mainnet);
		expect(result).toBe(mainnet);
		expect(result.chainId).toBe(1);
	});
});

describe("Chain.fromId", () => {
	test("returns Ethereum Mainnet for chainId 1", () => {
		const result = Chain.fromId(1);
		expect(result?.chainId).toBe(1);
		expect(result?.name).toBe("Ethereum Mainnet");
		expect(result?.nativeCurrency.symbol).toBe("ETH");
	});

	test("returns Sepolia for chainId 11155111", () => {
		const result = Chain.fromId(11155111);
		expect(result?.chainId).toBe(11155111);
		expect(result?.name).toBe("Sepolia");
	});

	test("returns canonical L2s and testnets", () => {
		expect(Chain.fromId(17000)?.name).toBe("Holesky");
		expect(Chain.fromId(560048)?.name).toBe("Hoodi");
		expect(Chain.fromId(10)?.name).toBe("OP Mainnet");
		expect(Chain.fromId(42161)?.name).toBe("Arbitrum One");
		expect(Chain.fromId(8453)?.name).toBe("Base");
		expect(Chain.fromId(137)?.name).toBe("Polygon Mainnet");
		expect(Chain.fromId(59144)?.name).toBe("Linea");
		expect(Chain.fromId(534352)?.name).toBe("Scroll");
		expect(Chain.fromId(324)?.name).toBe("zkSync Mainnet");
		expect(Chain.fromId(100)?.name).toBe("Gnosis");
		expect(Chain.fromId(56)?.name).toBe("BNB Smart Chain Mainnet");
		expect(Chain.fromId(43114)?.name).toBe("Avalanche C-Chain");
		expect(Chain.fromId(81457)?.name).toBe("Blast");
		expect(Chain.fromId(34443)?.name).toBe("Mode");
		expect(Chain.fromId(7777777)?.name).toBe("Zora");
	});

	test("returns undefined for invalid chainId", () => {
		const result = Chain.fromId(999999999);
		expect(result).toBeUndefined();
	});
});

describe("Chain.byId", () => {
	test("mainnet accessible via byId[1]", () => {
		const chain = Chain.byId[1];
		expect(chain?.chainId).toBe(1);
		expect(chain?.name).toBe("Ethereum Mainnet");
	});

	test("optimism accessible via byId[10]", () => {
		const chain = Chain.byId[10];
		expect(chain?.chainId).toBe(10);
		expect(chain?.name).toBe("OP Mainnet");
	});

	test("invalid chainId returns undefined", () => {
		const chain = Chain.byId[999999999];
		expect(chain).toBeUndefined();
	});
});
