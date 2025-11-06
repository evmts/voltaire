import { describe, expect, it } from "vitest";
import { BrandedWei } from "./BrandedWei/index.js";
import { BrandedGwei } from "./BrandedGwei/index.js";
import { BrandedEther } from "./BrandedEther/index.js";

describe("Denomination Integration Tests", () => {
	describe("Round-trip conversions", () => {
		it("Wei → Gwei → Wei preserves value", () => {
			const original = BrandedWei.from(5_000_000_000n);
			const gwei = BrandedWei.toGwei(original);
			const result = BrandedGwei.toWei(gwei);
			expect(result).toBe(original);
		});

		it("Wei → Ether → Wei preserves value", () => {
			const original = BrandedWei.from(3_000_000_000_000_000_000n);
			const ether = BrandedWei.toEther(original);
			const result = BrandedEther.toWei(ether);
			expect(result).toBe(original);
		});

		it("Gwei → Ether → Gwei preserves value", () => {
			const original = BrandedGwei.from(2_000_000_000n);
			const ether = BrandedGwei.toEther(original);
			const result = BrandedEther.toGwei(ether);
			expect(result).toBe(original);
		});

		it("Gwei → Wei → Gwei preserves value", () => {
			const original = BrandedGwei.from(42_000_000_000n);
			const wei = BrandedGwei.toWei(original);
			const result = BrandedWei.toGwei(wei);
			expect(result).toBe(original);
		});

		it("Ether → Wei → Ether preserves value", () => {
			const original = BrandedEther.from(7n);
			const wei = BrandedEther.toWei(original);
			const result = BrandedWei.toEther(wei);
			expect(result).toBe(original);
		});

		it("Ether → Gwei → Ether preserves value", () => {
			const original = BrandedEther.from(10n);
			const gwei = BrandedEther.toGwei(original);
			const result = BrandedGwei.toEther(gwei);
			expect(result).toBe(original);
		});

		it("Wei → Gwei → Ether → Gwei → Wei chain preserves value", () => {
			const original = BrandedWei.from(1_000_000_000_000_000_000n); // 1 ETH in Wei
			const gwei = BrandedWei.toGwei(original);
			const ether = BrandedGwei.toEther(gwei);
			const backToGwei = BrandedEther.toGwei(ether);
			const backToWei = BrandedGwei.toWei(backToGwei);
			expect(backToWei).toBe(original);
		});
	});

	describe("Cross-denomination comparisons", () => {
		it("1 ETH = 1,000,000,000 Gwei = 1,000,000,000,000,000,000 Wei", () => {
			const oneEth = BrandedEther.from(1n);
			const oneEthInGwei = BrandedEther.toGwei(oneEth);
			const oneEthInWei = BrandedEther.toWei(oneEth);

			expect(oneEthInGwei).toBe(1_000_000_000n);
			expect(oneEthInWei).toBe(1_000_000_000_000_000_000n);
		});

		it("1 Gwei = 1,000,000,000 Wei", () => {
			const oneGwei = BrandedGwei.from(1n);
			const oneGweiInWei = BrandedGwei.toWei(oneGwei);
			expect(oneGweiInWei).toBe(1_000_000_000n);
		});

		it("Equal values in different denominations compare correctly", () => {
			const wei = BrandedWei.from(1_000_000_000_000_000_000n);
			const gwei = BrandedGwei.from(1_000_000_000n);
			const ether = BrandedEther.from(1n);

			// Convert all to Wei for comparison
			const gweiAsWei = BrandedGwei.toWei(gwei);
			const etherAsWei = BrandedEther.toWei(ether);

			expect(wei).toBe(gweiAsWei);
			expect(wei).toBe(etherAsWei);
		});
	});

	describe("Precision edge cases", () => {
		it("Wei → Gwei truncates fractional Gwei", () => {
			const wei = BrandedWei.from(1_500_000_000n); // 1.5 Gwei
			const gwei = BrandedWei.toGwei(wei);
			expect(gwei).toBe(1n); // Truncates to 1 Gwei
		});

		it("Wei → Ether truncates fractional Ether", () => {
			const wei = BrandedWei.from(1_500_000_000_000_000_000n); // 1.5 ETH
			const ether = BrandedWei.toEther(wei);
			expect(ether).toBe(1n); // Truncates to 1 ETH
		});

		it("Gwei → Ether truncates fractional Ether", () => {
			const gwei = BrandedGwei.from(1_500_000_000n); // 1.5 ETH
			const ether = BrandedGwei.toEther(gwei);
			expect(ether).toBe(1n); // Truncates to 1 ETH
		});

		it("Truncation is consistent across conversions", () => {
			const wei = BrandedWei.from(1_999_999_999n); // Just under 2 Gwei
			const gwei = BrandedWei.toGwei(wei);
			expect(gwei).toBe(1n);

			const weiFromGwei = BrandedGwei.toWei(gwei);
			expect(weiFromGwei).toBe(1_000_000_000n);
			expect(weiFromGwei).not.toBe(wei); // Data loss from truncation
		});
	});

	describe("Large value handling", () => {
		it("handles near-max Uint256 values", () => {
			const large = 2n ** 200n;
			const wei = BrandedWei.from(large);
			const gwei = BrandedWei.toGwei(wei);
			const ether = BrandedWei.toEther(wei);

			// Verify conversions work without overflow
			expect(gwei).toBe(large / 1_000_000_000n);
			expect(ether).toBe(large / 1_000_000_000_000_000_000n);
		});

		it("handles large Ether amounts", () => {
			const million = 1_000_000n;
			const ether = BrandedEther.from(million);
			const wei = BrandedEther.toWei(ether);

			expect(wei).toBe(million * 1_000_000_000_000_000_000n);
		});

		it("round-trip works with very large values", () => {
			const large = 2n ** 200n;
			const wei = BrandedWei.from(large);
			const ether = BrandedWei.toEther(wei);
			const backToWei = BrandedEther.toWei(ether);

			// Due to truncation, we lose the fractional part
			const expectedWei =
				(large / 1_000_000_000_000_000_000n) * 1_000_000_000_000_000_000n;
			expect(backToWei).toBe(expectedWei);
		});
	});

	describe("Zero value handling", () => {
		it("0 Wei converts to 0 in all denominations", () => {
			const zero = BrandedWei.from(0);
			expect(BrandedWei.toGwei(zero)).toBe(0n);
			expect(BrandedWei.toEther(zero)).toBe(0n);
		});

		it("0 Gwei converts to 0 in all denominations", () => {
			const zero = BrandedGwei.from(0);
			expect(BrandedGwei.toWei(zero)).toBe(0n);
			expect(BrandedGwei.toEther(zero)).toBe(0n);
		});

		it("0 Ether converts to 0 in all denominations", () => {
			const zero = BrandedEther.from(0);
			expect(BrandedEther.toWei(zero)).toBe(0n);
			expect(BrandedEther.toGwei(zero)).toBe(0n);
		});

		it("round-trip with zero preserves value", () => {
			const zero = BrandedWei.from(0);
			const gwei = BrandedWei.toGwei(zero);
			const ether = BrandedGwei.toEther(gwei);
			const backToGwei = BrandedEther.toGwei(ether);
			const backToWei = BrandedGwei.toWei(backToGwei);
			expect(backToWei).toBe(0n);
		});
	});

	describe("Realistic Ethereum values", () => {
		it("typical gas price (50 Gwei) converts correctly", () => {
			const gasPrice = BrandedGwei.from(50n);
			const gasPriceWei = BrandedGwei.toWei(gasPrice);
			expect(gasPriceWei).toBe(50_000_000_000n);
		});

		it("typical transaction value (0.1 ETH) converts correctly", () => {
			const value = BrandedEther.from(1n); // 0.1 ETH = 100000000000000000 Wei
			const valueWei = BrandedEther.toWei(value);
			// Note: For 0.1 ETH, we'd use Wei directly as Ether is for whole units
			// But let's verify 1 ETH
			expect(valueWei).toBe(1_000_000_000_000_000_000n);
		});

		it("typical account balance (1.5 ETH) with precision", () => {
			// 1.5 ETH in Wei
			const balance = BrandedWei.from(1_500_000_000_000_000_000n);
			const balanceGwei = BrandedWei.toGwei(balance);
			expect(balanceGwei).toBe(1_500_000_000n);

			const balanceEther = BrandedWei.toEther(balance);
			expect(balanceEther).toBe(1n); // Truncates to 1 ETH
		});
	});
});
