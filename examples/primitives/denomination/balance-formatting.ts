/**
 * Example 3: Balance Formatting and Display
 *
 * Demonstrates:
 * - Formatting Wei values as Ether with decimals
 * - Handling fractional ETH amounts
 * - Choosing appropriate units for display
 * - Compact and full precision formatting
 */

import * as Ether from "../../../src/primitives/Denomination/Ether.js";
import * as Gwei from "../../../src/primitives/Denomination/Gwei.js";
import * as Wei from "../../../src/primitives/Denomination/Wei.js";
import * as Uint from "../../../src/primitives/Uint/index.js";

function formatWeiAsEther(wei: Wei.Type, decimals = 18): string {
	const weiU256 = Wei.toU256(wei);
	const weiPerEther = Uint.from(1_000_000_000_000_000_000n);

	// Split into whole and fractional parts
	const wholePart = Uint.dividedBy(weiU256, weiPerEther);
	const fractionalPart = Uint.modulo(weiU256, weiPerEther);

	// Format fractional part with desired decimals
	const fractionalStr = fractionalPart.toString().padStart(18, "0");
	const truncated = fractionalStr.slice(0, decimals);

	// Remove trailing zeros
	const trimmed = truncated.replace(/0+$/, "") || "0";

	return `${wholePart}.${trimmed}`;
}

const balances = [
	Wei.from(1_234_567_890_123_456_789n), // 1.234... ETH
	Wei.from(500_000_000_000_000_000n), // 0.5 ETH
	Wei.from(1_000_000_000_000_000_000n), // 1 ETH
	Wei.from(123_456_789n), // Very small
];

for (const balance of balances) {
}

function formatBalance(wei: Wei.Type): string {
	const weiU256 = Wei.toU256(wei);

	// If >= 0.01 ETH, show in ETH
	if (weiU256 >= 10_000_000_000_000_000n) {
		const ethNum = Number(weiU256) / 1e18;
		return `${ethNum.toFixed(4)} ETH`;
	}

	// If >= 0.00001 Gwei, show in Gwei
	if (weiU256 >= 10_000n) {
		const gwei = Wei.toGwei(wei);
		return `${gwei} Gwei`;
	}

	// Otherwise show in Wei
	return `${wei} Wei`;
}

const amounts = [
	Wei.from(1_000_000_000_000_000_000n), // 1 ETH
	Wei.from(50_000_000_000_000_000n), // 0.05 ETH
	Wei.from(50_000_000_000n), // 50 Gwei
	Wei.from(1_000n), // 1000 Wei
	Wei.from(1n), // 1 Wei
];

for (const amount of amounts) {
}

function formatCompact(wei: Wei.Type): string {
	const weiU256 = Wei.toU256(wei);
	const weiPerEther = Uint.from(1_000_000_000_000_000_000n);

	const wholePart = Uint.dividedBy(weiU256, weiPerEther);
	const fractionalPart = Uint.modulo(weiU256, weiPerEther);

	if (fractionalPart === 0n) {
		return `${wholePart} ETH`;
	}

	// Show only significant decimals (4 digits)
	const fractionalStr = fractionalPart.toString().padStart(18, "0");
	const significant = fractionalStr.slice(0, 4);

	return `${wholePart}.${significant} ETH`;
}

for (const amount of balances) {
}

function parseEtherInput(input: string): Wei.Type {
	const [whole, fractional = "0"] = input.split(".");

	// Convert to Wei manually to preserve fractional part
	const wholeBigInt = BigInt(whole);
	const fractionalPadded = fractional.padEnd(18, "0").slice(0, 18);
	const fractionalBigInt = BigInt(fractionalPadded);

	const wholeWei = Ether.toWei(Ether.from(wholeBigInt));
	const totalWei = Wei.from(Wei.toU256(wholeWei) + fractionalBigInt);

	return totalWei;
}

const userInputs = ["1", "1.5", "0.001", "10.123456789123456789"];

for (const input of userInputs) {
	const wei = parseEtherInput(input);
}

const walletA = Wei.from(1_234_567_890_123_456_789n);
const walletB = Wei.from(987_654_321_098_765_432n);

const totalBalance = Wei.from(10_000_000_000_000_000_000n); // 10 ETH
const percentages = [100, 50, 25, 10, 1];

for (const pct of percentages) {
	const amount = Wei.from((Wei.toU256(totalBalance) * BigInt(pct)) / 100n);
}
