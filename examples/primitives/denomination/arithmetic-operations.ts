/**
 * Example 6: Arithmetic Operations with Denominations
 *
 * Demonstrates:
 * - Adding and subtracting denomination values
 * - Percentage calculations
 * - Splitting values
 * - Working with multiple denominations safely
 */

import * as Ether from "../../../src/primitives/Denomination/Ether.js";
import * as Gwei from "../../../src/primitives/Denomination/Gwei.js";
import * as Wei from "../../../src/primitives/Denomination/Wei.js";
import * as Uint from "../../../src/primitives/Uint/index.js";

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
for (const { pct, name } of percentages) {
	const fee = calculatePercentage(amount, pct);
}

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
shares.forEach((share, i) => {});

// Verify total
const verifyTotal = addWei(...shares);

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
distribution.forEach((share, i) => {
	const percentage =
		(Number(weights[i]) / Number(weights.reduce((a, b) => a + b))) * 100;
});

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
transactions.forEach((tx, i) => {
	const sign = tx.type === "credit" ? "+" : "-";
	const amount = Number(Wei.toU256(tx.amount)) / 1e18;
	const newBalance = Number(Wei.toU256(balanceHistory[i + 1])) / 1e18;
});
