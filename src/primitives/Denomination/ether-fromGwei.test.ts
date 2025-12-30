import { describe, expect, it } from "vitest";
import { fromGwei } from "./ether-fromGwei.js";
import { Gwei } from "./gwei-index.js";

describe("fromGwei", () => {
	it("converts 1 billion Gwei to 1 Ether", () => {
		const gwei = Gwei.from("1000000000");
		const ether = fromGwei(gwei);
		expect(typeof ether).toBe("string");
		expect(ether).toBe("1");
	});

	it("converts 0 Gwei to 0 Ether", () => {
		const gwei = Gwei.from("0");
		const ether = fromGwei(gwei);
		expect(ether).toBe("0");
	});

	it("converts 5 billion Gwei to 5 Ether", () => {
		const gwei = Gwei.from("5000000000");
		const ether = fromGwei(gwei);
		expect(ether).toBe("5");
	});

	it("preserves fractional Ether", () => {
		const gwei = Gwei.from("1500000000"); // 1.5 ETH
		const ether = fromGwei(gwei);
		expect(ether).toBe("1.5"); // Preserves as string
	});

	it("converts large Gwei value", () => {
		const gwei = Gwei.from("1000000000000");
		const ether = fromGwei(gwei);
		expect(ether).toBe("1000");
	});
});
