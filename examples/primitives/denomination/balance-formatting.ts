/**
 * Example 3: Balance Formatting and Display
 *
 * Demonstrates:
 * - Formatting Wei values as Ether with decimals
 * - Handling fractional ETH amounts
 * - Choosing appropriate units for display
 * - Compact and full precision formatting
 */

import * as Wei from "../../../src/primitives/Denomination/Wei.js";
import * as Gwei from "../../../src/primitives/Denomination/Gwei.js";
import * as Ether from "../../../src/primitives/Denomination/Ether.js";
import * as Uint from "../../../src/primitives/Uint/index.js";

console.log("\n=== Balance Formatting and Display ===\n");

// Example 1: Format Wei as Ether with decimals
console.log("1. Formatting Wei as Ether\n");
console.log("   ------------------------");

function formatWeiAsEther(wei: Wei.Type, decimals: number = 18): string {
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
	console.log(`   ${Wei.toU256(balance)} Wei:`);
	console.log(`     Full (18): ${formatWeiAsEther(balance, 18)} ETH`);
	console.log(`     Standard (6): ${formatWeiAsEther(balance, 6)} ETH`);
	console.log(`     Compact (2): ${formatWeiAsEther(balance, 2)} ETH`);
}

console.log("");

// Example 2: Smart unit selection
console.log("2. Smart Unit Selection\n");
console.log("   ---------------------");

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
	console.log(`   ${Wei.toU256(amount)} Wei → ${formatBalance(amount)}`);
}

console.log("");

// Example 3: Compact display (significant digits only)
console.log("3. Compact Display\n");
console.log("   ----------------");

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
	console.log(`   ${formatCompact(amount)}`);
}

console.log("");

// Example 4: Parse user input (string to Wei)
console.log("4. Parse User Input\n");
console.log("   -----------------");

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
	console.log(`   "${input}" ETH → ${Wei.toU256(wei)} Wei`);
	console.log(`   Formatted back: ${formatWeiAsEther(wei, 18)} ETH`);
}

console.log("");

// Example 5: Balance comparison with formatting
console.log("5. Balance Comparison\n");
console.log("   -------------------");

const walletA = Wei.from(1_234_567_890_123_456_789n);
const walletB = Wei.from(987_654_321_098_765_432n);

console.log(`   Wallet A: ${formatWeiAsEther(walletA, 6)} ETH`);
console.log(`   Wallet B: ${formatWeiAsEther(walletB, 6)} ETH`);
console.log(
	`   Difference: ${formatWeiAsEther(Wei.from(Wei.toU256(walletA) - Wei.toU256(walletB)), 6)} ETH`,
);
console.log(
	`   Total: ${formatWeiAsEther(Wei.from(Wei.toU256(walletA) + Wei.toU256(walletB)), 6)} ETH`,
);

console.log("");

// Example 6: Percentage display
console.log("6. Percentage of Balance\n");
console.log("   ----------------------");

const totalBalance = Wei.from(10_000_000_000_000_000_000n); // 10 ETH
const percentages = [100, 50, 25, 10, 1];

for (const pct of percentages) {
	const amount = Wei.from((Wei.toU256(totalBalance) * BigInt(pct)) / 100n);
	console.log(`   ${pct}%: ${formatWeiAsEther(amount, 4)} ETH`);
}

console.log("\n=== Example Complete ===\n");
