/**
 * Example 6: Arithmetic Operations with Denominations
 *
 * Demonstrates:
 * - Adding and subtracting denomination values
 * - Percentage calculations
 * - Splitting values
 * - Working with multiple denominations safely
 */

import * as Wei from "../../../src/primitives/Denomination/Wei.js";
import * as Gwei from "../../../src/primitives/Denomination/Gwei.js";
import * as Ether from "../../../src/primitives/Denomination/Ether.js";
import * as Uint from "../../../src/primitives/Uint/index.js";

console.log("\n=== Arithmetic Operations with Denominations ===\n");

// Example 1: Adding values in Wei
console.log("1. Adding Wei Values\n");
console.log("   ------------------");

function addWei(...amounts: Wei.Type[]): Wei.Type {
	let total = 0n;
	for (const amount of amounts) {
		total += Wei.toU256(amount);
	}
	return Wei.from(total);
}

const wallet1 = Wei.from(1_000_000_000_000_000_000n); // 1 ETH
const wallet2 = Wei.from(500_000_000_000_000_000n); // 0.5 ETH
const wallet3 = Wei.from(250_000_000_000_000_000n); // 0.25 ETH

const total = addWei(wallet1, wallet2, wallet3);

console.log(`   Wallet 1: ${Number(Wei.toU256(wallet1)) / 1e18} ETH`);
console.log(`   Wallet 2: ${Number(Wei.toU256(wallet2)) / 1e18} ETH`);
console.log(`   Wallet 3: ${Number(Wei.toU256(wallet3)) / 1e18} ETH`);
console.log(`   Total: ${Number(Wei.toU256(total)) / 1e18} ETH`);

console.log("");

// Example 2: Subtracting gas costs from balance
console.log("2. Deducting Gas Costs\n");
console.log("   -------------------");

function deductGasCost(
	balance: Wei.Type,
	gasCost: Wei.Type,
): {
	newBalance: Wei.Type;
	sufficient: boolean;
} {
	const balanceU256 = Wei.toU256(balance);
	const gasCostU256 = Wei.toU256(gasCost);

	if (balanceU256 < gasCostU256) {
		return { newBalance: Wei.from(0n), sufficient: false };
	}

	return {
		newBalance: Wei.from(balanceU256 - gasCostU256),
		sufficient: true,
	};
}

const balance = Wei.from(2_000_000_000_000_000_000n); // 2 ETH
const gasPrice = Gwei.from(50n);
const gasUsed = 21_000n;
const gasCost = Wei.from(Uint.times(Gwei.toWei(gasPrice), Uint.from(gasUsed)));

const result = deductGasCost(balance, gasCost);

console.log(`   Balance: ${Number(Wei.toU256(balance)) / 1e18} ETH`);
console.log(`   Gas cost: ${Number(Wei.toU256(gasCost)) / 1e18} ETH`);
console.log(`   Sufficient: ${result.sufficient ? "✓" : "✗"}`);
console.log(
	`   New balance: ${Number(Wei.toU256(result.newBalance)) / 1e18} ETH`,
);

console.log("");

// Example 3: Calculating percentages
console.log("3. Percentage Calculations\n");
console.log("   ------------------------");

function calculatePercentage(
	amount: Wei.Type,
	percentage: bigint, // Basis points (100 = 1%)
): Wei.Type {
	const amountU256 = Wei.toU256(amount);
	const percentageU256 = Uint.from(percentage);
	const basis = Uint.from(10_000n); // 100% = 10,000 basis points

	const result = Uint.dividedBy(Uint.times(amountU256, percentageU256), basis);

	return Wei.from(result);
}

const amount = Wei.from(10_000_000_000_000_000_000n); // 10 ETH
const percentages = [
	{ pct: 100n, name: "1%" },
	{ pct: 250n, name: "2.5%" },
	{ pct: 500n, name: "5%" },
	{ pct: 1000n, name: "10%" },
	{ pct: 5000n, name: "50%" },
];

console.log(`   Amount: ${Number(Wei.toU256(amount)) / 1e18} ETH`);
for (const { pct, name } of percentages) {
	const fee = calculatePercentage(amount, pct);
	console.log(`   ${name}: ${Number(Wei.toU256(fee)) / 1e18} ETH`);
}

console.log("");

// Example 4: Splitting values
console.log("4. Splitting Values Equally\n");
console.log("   -------------------------");

function splitEqually(total: Wei.Type, parts: number): Wei.Type[] {
	const totalU256 = Wei.toU256(total);
	const partsU256 = Uint.from(BigInt(parts));

	const share = Uint.dividedBy(totalU256, partsU256);
	const remainder = Uint.modulo(totalU256, partsU256);

	const shares: Wei.Type[] = [];

	// Create equal shares
	for (let i = 0; i < parts; i++) {
		if (i === 0) {
			// First share gets the remainder
			shares.push(Wei.from(share + remainder));
		} else {
			shares.push(Wei.from(share));
		}
	}

	return shares;
}

const totalAmount = Wei.from(1_000_000_000_000_000_000n); // 1 ETH
const splitParts = 3;
const shares = splitEqually(totalAmount, splitParts);

console.log(`   Total: ${Number(Wei.toU256(totalAmount)) / 1e18} ETH`);
console.log(`   Split into ${splitParts} parts:`);
shares.forEach((share, i) => {
	console.log(`     Part ${i + 1}: ${Number(Wei.toU256(share)) / 1e18} ETH`);
});

// Verify total
const verifyTotal = addWei(...shares);
console.log(`   Verify sum: ${Number(Wei.toU256(verifyTotal)) / 1e18} ETH`);

console.log("");

// Example 5: Weighted distribution
console.log("5. Weighted Distribution\n");
console.log("   ----------------------");

function distributeWeighted(total: Wei.Type, weights: bigint[]): Wei.Type[] {
	const totalU256 = Wei.toU256(total);
	const totalWeight = weights.reduce((sum, w) => sum + w, 0n);

	const shares: Wei.Type[] = [];
	let distributed = 0n;

	for (let i = 0; i < weights.length; i++) {
		if (i === weights.length - 1) {
			// Last share gets remainder to avoid rounding errors
			shares.push(Wei.from(totalU256 - distributed));
		} else {
			const share = (totalU256 * weights[i]) / totalWeight;
			shares.push(Wei.from(share));
			distributed += share;
		}
	}

	return shares;
}

const totalPool = Wei.from(10_000_000_000_000_000_000n); // 10 ETH
const weights = [50n, 30n, 20n]; // 50%, 30%, 20%

const distribution = distributeWeighted(totalPool, weights);

console.log(`   Total pool: ${Number(Wei.toU256(totalPool)) / 1e18} ETH`);
console.log("   Distribution:");
distribution.forEach((share, i) => {
	const percentage =
		(Number(weights[i]) / Number(weights.reduce((a, b) => a + b))) * 100;
	console.log(
		`     Share ${i + 1} (${percentage}%): ${Number(Wei.toU256(share)) / 1e18} ETH`,
	);
});

console.log("");

// Example 6: Safe denomination mixing
console.log("6. Safe Denomination Mixing\n");
console.log("   -------------------------");

function combineAmounts(
	ethAmount: Ether.Type,
	gweiAmount: Gwei.Type,
	weiAmount: Wei.Type,
): Wei.Type {
	// Convert all to Wei for safe addition
	const ethWei = Ether.toWei(ethAmount);
	const gweiWei = Gwei.toWei(gweiAmount);

	const total =
		Wei.toU256(ethWei) + Wei.toU256(gweiWei) + Wei.toU256(weiAmount);

	return Wei.from(total);
}

const ethPart = Ether.from(1n); // 1 ETH
const gweiPart = Gwei.from(500n); // 500 Gwei
const weiPart = Wei.from(123_456_789n); // Some Wei

const combined = combineAmounts(ethPart, gweiPart, weiPart);

console.log("   Combining different denominations:");
console.log(`     ${ethPart} Ether`);
console.log(`     ${gweiPart} Gwei`);
console.log(`     ${weiPart} Wei`);
console.log(`   Total: ${combined} Wei`);
console.log(`   Total: ${Number(Wei.toU256(combined)) / 1e18} ETH`);

console.log("");

// Example 7: Running balance with transactions
console.log("7. Running Balance Tracker\n");
console.log("   ------------------------");

interface Transaction {
	type: "credit" | "debit";
	amount: Wei.Type;
	description: string;
}

function processTransactions(
	initialBalance: Wei.Type,
	transactions: Transaction[],
): Wei.Type[] {
	const balances: Wei.Type[] = [initialBalance];
	let currentBalance = Wei.toU256(initialBalance);

	for (const tx of transactions) {
		const amountU256 = Wei.toU256(tx.amount);

		if (tx.type === "credit") {
			currentBalance = currentBalance + amountU256;
		} else {
			currentBalance = currentBalance - amountU256;
		}

		balances.push(Wei.from(currentBalance));
	}

	return balances;
}

const initialBalance = Wei.from(5_000_000_000_000_000_000n); // 5 ETH

const transactions: Transaction[] = [
	{
		type: "debit",
		amount: Wei.from(1_000_000_000_000_000_000n),
		description: "Send 1 ETH",
	},
	{
		type: "credit",
		amount: Wei.from(500_000_000_000_000_000n),
		description: "Receive 0.5 ETH",
	},
	{
		type: "debit",
		amount: Wei.from(50_000_000_000_000n),
		description: "Gas fee",
	},
	{
		type: "credit",
		amount: Wei.from(2_000_000_000_000_000_000n),
		description: "Receive 2 ETH",
	},
];

const balanceHistory = processTransactions(initialBalance, transactions);

console.log(
	`   Initial balance: ${Number(Wei.toU256(balanceHistory[0])) / 1e18} ETH`,
);
transactions.forEach((tx, i) => {
	const sign = tx.type === "credit" ? "+" : "-";
	const amount = Number(Wei.toU256(tx.amount)) / 1e18;
	const newBalance = Number(Wei.toU256(balanceHistory[i + 1])) / 1e18;
	console.log(
		`   ${sign}${amount} ETH (${tx.description}) → ${newBalance} ETH`,
	);
});

console.log("\n=== Example Complete ===\n");
