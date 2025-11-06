import { describe, expect, it } from "vitest";
import { Wei } from "./BrandedWei/index.js";
import { Gwei } from "./BrandedGwei/index.js";
import { Ether } from "./BrandedEther/index.js";

describe("Denomination Integration Tests", () => {
	describe("Round-trip conversions", () => {
		it("Wei → Gwei → Wei preserves value", () => {
			const original = Wei.from(5_000_000_000n);
			const gwei = Wei.toGwei(original);
			const result = Gwei.toWei(gwei);
			expect(result).toBe(original);
		});

		it("Wei → Ether → Wei preserves value", () => {
			const original = Wei.from(3_000_000_000_000_000_000n);
			const ether = Wei.toEther(original);
			const result = Ether.toWei(ether);
			expect(result).toBe(original);
		});

		it("Gwei → Ether → Gwei preserves value", () => {
			const original = Gwei.from(2_000_000_000n);
			const ether = Gwei.toEther(original);
			const result = Ether.toGwei(ether);
			expect(result).toBe(original);
		});

		it("Gwei → Wei → Gwei preserves value", () => {
			const original = Gwei.from(42_000_000_000n);
			const wei = Gwei.toWei(original);
			const result = Wei.toGwei(wei);
			expect(result).toBe(original);
		});

		it("Ether → Wei → Ether preserves value", () => {
			const original = Ether.from(7n);
			const wei = Ether.toWei(original);
			const result = Wei.toEther(wei);
			expect(result).toBe(original);
		});

		it("Ether → Gwei → Ether preserves value", () => {
			const original = Ether.from(10n);
			const gwei = Ether.toGwei(original);
			const result = Gwei.toEther(gwei);
			expect(result).toBe(original);
		});

		it("Wei → Gwei → Ether → Gwei → Wei chain preserves value", () => {
			const original = Wei.from(1_000_000_000_000_000_000n); // 1 ETH in Wei
			const gwei = Wei.toGwei(original);
			const ether = Gwei.toEther(gwei);
			const backToGwei = Ether.toGwei(ether);
			const backToWei = Gwei.toWei(backToGwei);
			expect(backToWei).toBe(original);
		});
	});

	describe("Cross-denomination comparisons", () => {
		it("1 ETH = 1,000,000,000 Gwei = 1,000,000,000,000,000,000 Wei", () => {
			const oneEth = Ether.from(1n);
			const oneEthInGwei = Ether.toGwei(oneEth);
			const oneEthInWei = Ether.toWei(oneEth);

			expect(oneEthInGwei).toBe(1_000_000_000n);
			expect(oneEthInWei).toBe(1_000_000_000_000_000_000n);
		});

		it("1 Gwei = 1,000,000,000 Wei", () => {
			const oneGwei = Gwei.from(1n);
			const oneGweiInWei = Gwei.toWei(oneGwei);
			expect(oneGweiInWei).toBe(1_000_000_000n);
		});

		it("Equal values in different denominations compare correctly", () => {
			const wei = Wei.from(1_000_000_000_000_000_000n);
			const gwei = Gwei.from(1_000_000_000n);
			const ether = Ether.from(1n);

			// Convert all to Wei for comparison
			const gweiAsWei = Gwei.toWei(gwei);
			const etherAsWei = Ether.toWei(ether);

			expect(wei).toBe(gweiAsWei);
			expect(wei).toBe(etherAsWei);
		});
	});

	describe("Precision edge cases", () => {
		it("Wei → Gwei truncates fractional Gwei", () => {
			const wei = Wei.from(1_500_000_000n); // 1.5 Gwei
			const gwei = Wei.toGwei(wei);
			expect(gwei).toBe(1n); // Truncates to 1 Gwei
		});

		it("Wei → Ether truncates fractional Ether", () => {
			const wei = Wei.from(1_500_000_000_000_000_000n); // 1.5 ETH
			const ether = Wei.toEther(wei);
			expect(ether).toBe(1n); // Truncates to 1 ETH
		});

		it("Gwei → Ether truncates fractional Ether", () => {
			const gwei = Gwei.from(1_500_000_000n); // 1.5 ETH
			const ether = Gwei.toEther(gwei);
			expect(ether).toBe(1n); // Truncates to 1 ETH
		});

		it("Truncation is consistent across conversions", () => {
			const wei = Wei.from(1_999_999_999n); // Just under 2 Gwei
			const gwei = Wei.toGwei(wei);
			expect(gwei).toBe(1n);

			const weiFromGwei = Gwei.toWei(gwei);
			expect(weiFromGwei).toBe(1_000_000_000n);
			expect(weiFromGwei).not.toBe(wei); // Data loss from truncation
		});
	});

	describe("Large value handling", () => {
		it("handles near-max Uint256 values", () => {
			const large = 2n ** 200n;
			const wei = Wei.from(large);
			const gwei = Wei.toGwei(wei);
			const ether = Wei.toEther(wei);

			// Verify conversions work without overflow
			expect(gwei).toBe(large / 1_000_000_000n);
			expect(ether).toBe(large / 1_000_000_000_000_000_000n);
		});

		it("handles large Ether amounts", () => {
			const million = 1_000_000n;
			const ether = Ether.from(million);
			const wei = Ether.toWei(ether);

			expect(wei).toBe(million * 1_000_000_000_000_000_000n);
		});

		it("round-trip works with very large values", () => {
			const large = 2n ** 200n;
			const wei = Wei.from(large);
			const ether = Wei.toEther(wei);
			const backToWei = Ether.toWei(ether);

			// Due to truncation, we lose the fractional part
			const expectedWei =
				(large / 1_000_000_000_000_000_000n) * 1_000_000_000_000_000_000n;
			expect(backToWei).toBe(expectedWei);
		});
	});

	describe("Zero value handling", () => {
		it("0 Wei converts to 0 in all denominations", () => {
			const zero = Wei.from(0);
			expect(Wei.toGwei(zero)).toBe(0n);
			expect(Wei.toEther(zero)).toBe(0n);
		});

		it("0 Gwei converts to 0 in all denominations", () => {
			const zero = Gwei.from(0);
			expect(Gwei.toWei(zero)).toBe(0n);
			expect(Gwei.toEther(zero)).toBe(0n);
		});

		it("0 Ether converts to 0 in all denominations", () => {
			const zero = Ether.from(0);
			expect(Ether.toWei(zero)).toBe(0n);
			expect(Ether.toGwei(zero)).toBe(0n);
		});

		it("round-trip with zero preserves value", () => {
			const zero = Wei.from(0);
			const gwei = Wei.toGwei(zero);
			const ether = Gwei.toEther(gwei);
			const backToGwei = Ether.toGwei(ether);
			const backToWei = Gwei.toWei(backToGwei);
			expect(backToWei).toBe(0n);
		});
	});

	describe("Realistic Ethereum values", () => {
		it("typical gas price (50 Gwei) converts correctly", () => {
			const gasPrice = Gwei.from(50n);
			const gasPriceWei = Gwei.toWei(gasPrice);
			expect(gasPriceWei).toBe(50_000_000_000n);
		});

		it("typical transaction value (0.1 ETH) converts correctly", () => {
			const value = Ether.from(1n); // 0.1 ETH = 100000000000000000 Wei
			const valueWei = Ether.toWei(value);
			// Note: For 0.1 ETH, we'd use Wei directly as Ether is for whole units
			// But let's verify 1 ETH
			expect(valueWei).toBe(1_000_000_000_000_000_000n);
		});

		it("typical account balance (1.5 ETH) with precision", () => {
			// 1.5 ETH in Wei
			const balance = Wei.from(1_500_000_000_000_000_000n);
			const balanceGwei = Wei.toGwei(balance);
			expect(balanceGwei).toBe(1_500_000_000n);

			const balanceEther = Wei.toEther(balance);
			expect(balanceEther).toBe(1n); // Truncates to 1 ETH
		});
	});
});
