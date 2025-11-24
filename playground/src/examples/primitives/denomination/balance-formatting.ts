import * as Wei from "../../../primitives/Denomination/Wei.js";
import * as Gwei from "../../../primitives/Denomination/Gwei.js";
import * as Ether from "../../../primitives/Denomination/Ether.js";
import * as Uint from "../../../primitives/Uint/index.js";

// Example: Balance formatting and display patterns

console.log("=== Wallet Balance Formatting ===\n");

const balances = [
	{ name: "Empty", wei: Wei.from(0n) },
	{ name: "Dust", wei: Wei.from(1000n) },
	{ name: "Small", wei: Wei.from(100_000_000_000_000_000n) },
	{ name: "Medium", wei: Wei.from(5_000_000_000_000_000_000n) },
	{ name: "Large", wei: Wei.from(150_000_000_000_000_000_000n) },
	{ name: "Whale", wei: Wei.from(10_000_000_000_000_000_000_000n) },
];

function formatBalance(wei: Wei.Type): string {
	const ether = Wei.toEther(wei);
	const etherStr = Uint.toString(Ether.toU256(ether));
	return etherStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

for (const { name, wei } of balances) {
	const formatted = formatBalance(wei);
	console.log(`${name.padEnd(10)}: ${formatted.padStart(20)} ETH`);
	console.log(
		`${" ".repeat(12)} ${Uint.toString(Wei.toU256(wei)).padStart(20)} wei`,
	);
}

console.log("\n=== Multi-Account Portfolio ===\n");

const accounts = [
	{
		address: "0x742d35Cc...f44e",
		balance: Wei.from(5_250_000_000_000_000_000n),
	},
	{
		address: "0xd8da6bf2...6045",
		balance: Wei.from(12_750_000_000_000_000_000n),
	},
	{
		address: "0x5aAed593...0fbd",
		balance: Wei.from(3_500_000_000_000_000_000n),
	},
];

console.log("Portfolio balances:");
for (const { address, balance } of accounts) {
	console.log(`  ${address}: ${formatBalance(balance)} ETH`);
}

const totalBalance = accounts.reduce((sum, acc) => {
	return Uint.plus(sum, Wei.toU256(acc.balance));
}, Uint.from(0n)) as Wei.Type;

console.log("\nTotal portfolio:", formatBalance(totalBalance), "ETH");
console.log("Total in wei:   ", Uint.toString(Wei.toU256(totalBalance)));

console.log("\n=== Token Balance Display ===\n");

const tokenBalances = [
	{ symbol: "ETH", decimals: 18, balance: 5_250_000_000_000_000_000n },
	{ symbol: "USDC", decimals: 6, balance: 10_000_000_000n },
	{ symbol: "DAI", decimals: 18, balance: 2_500_000_000_000_000_000n },
	{ symbol: "WBTC", decimals: 8, balance: 50_000_000n },
];

function formatTokenBalance(
	balance: bigint,
	decimals: number,
	symbol: string,
): string {
	const divisor = 10n ** BigInt(decimals);
	const whole = balance / divisor;
	return `${whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ${symbol}`;
}

console.log("Token balances:");
for (const { symbol, decimals, balance } of tokenBalances) {
	console.log(`  ${formatTokenBalance(balance, decimals, symbol)}`);
}

console.log("\n=== Historical Balance Changes ===\n");

const history = [
	{ date: "2024-01-01", balance: Wei.from(10_000_000_000_000_000_000n) },
	{ date: "2024-02-01", balance: Wei.from(12_500_000_000_000_000_000n) },
	{ date: "2024-03-01", balance: Wei.from(11_750_000_000_000_000_000n) },
	{ date: "2024-04-01", balance: Wei.from(15_000_000_000_000_000_000n) },
];

console.log("Balance history:");
let previous: Wei.Type | null = null;

for (const { date, balance } of history) {
	const formatted = formatBalance(balance);
	let change = "";

	if (previous) {
		const diff = Uint.minus(Wei.toU256(balance), Wei.toU256(previous));
		const isPositive = Uint.greaterThan(
			Wei.toU256(balance),
			Wei.toU256(previous),
		);
		const symbol = isPositive ? "+" : "-";
		const absDiff = isPositive ? diff : Uint.minus(Uint.from(0n), diff);
		const diffEther = Wei.toEther(absDiff as Wei.Type);
		change = ` (${symbol}${Uint.toString(Ether.toU256(diffEther))} ETH)`;
	}

	console.log(`  ${date}: ${formatted.padStart(10)} ETH${change}`);
	previous = balance;
}

console.log("\n=== Percentage-Based Display ===\n");

const totalSupply = Wei.from(100_000_000_000_000_000_000_000n);
const userBalance = Wei.from(2_500_000_000_000_000_000_000n);

function calculatePercentage(part: Wei.Type, whole: Wei.Type): string {
	const partBigInt = Uint.toBigInt(Wei.toU256(part));
	const wholeBigInt = Uint.toBigInt(Wei.toU256(whole));
	const percentage = (Number(partBigInt) / Number(wholeBigInt)) * 100;
	return percentage.toFixed(4);
}

console.log("Ownership calculation:");
console.log("Total supply:  ", formatBalance(totalSupply), "ETH");
console.log("User balance:  ", formatBalance(userBalance), "ETH");
console.log(
	"Ownership:     ",
	calculatePercentage(userBalance, totalSupply),
	"%",
);

console.log("\n=== Compact Display for Large Values ===\n");

function compactBalance(wei: Wei.Type): string {
	const ether = Number(Uint.toBigInt(Ether.toU256(Wei.toEther(wei))));

	if (ether >= 1_000_000_000) {
		return `${(ether / 1_000_000_000).toFixed(2)}B ETH`;
	}
	if (ether >= 1_000_000) {
		return `${(ether / 1_000_000).toFixed(2)}M ETH`;
	}
	if (ether >= 1_000) {
		return `${(ether / 1_000).toFixed(2)}K ETH`;
	}
	return `${ether.toFixed(2)} ETH`;
}

const largeBalances = [
	Wei.from(500_000_000_000_000_000n),
	Wei.from(5_000_000_000_000_000_000_000n),
	Wei.from(50_000_000_000_000_000_000_000n),
	Wei.from(500_000_000_000_000_000_000_000n),
];

console.log("Compact notation:");
for (const balance of largeBalances) {
	console.log(
		`  ${formatBalance(balance).padStart(25)} ETH = ${compactBalance(balance)}`,
	);
}

console.log("\n=== Balance with Pending Transactions ===\n");

const currentBalance = Wei.from(10_000_000_000_000_000_000n);
const pendingOut = Wei.from(2_000_000_000_000_000_000n);
const pendingIn = Wei.from(500_000_000_000_000_000n);

console.log("Current balance:    ", formatBalance(currentBalance), "ETH");
console.log("Pending outgoing: - ", formatBalance(pendingOut), "ETH");
console.log("Pending incoming: + ", formatBalance(pendingIn), "ETH");

const projected = Uint.minus(
	Wei.toU256(currentBalance),
	Wei.toU256(pendingOut),
);
const projectedWithIn = Uint.plus(projected, Wei.toU256(pendingIn));

console.log(
	"Projected balance:  ",
	formatBalance(projectedWithIn as Wei.Type),
	"ETH",
);

console.log("\n=== Multi-Currency Balance ===\n");

// Display balance in multiple units
const balance = Wei.from(7_500_000_000_000_000_000n);

console.log("Balance representations:");
console.log("  Wei:   ", Uint.toString(Wei.toU256(balance)).padStart(25));
console.log(
	"  Gwei:  ",
	Uint.toString(Gwei.toU256(Wei.toGwei(balance))).padStart(25),
);
console.log("  Ether: ", formatBalance(balance).padStart(25));

console.log("\n=== Zero Balance Handling ===\n");

const zeroBalance = Wei.from(0n);
const microBalance = Wei.from(100n);

console.log("Empty wallet checks:");
console.log(
	"Zero balance:",
	Uint.isZero(Wei.toU256(zeroBalance)) ? "Empty" : "Has funds",
);
console.log(
	"Micro balance:",
	Uint.isZero(Wei.toU256(microBalance)) ? "Empty" : "Has funds",
);

console.log("\n=== Threshold-Based Display ===\n");

function displayWithThreshold(wei: Wei.Type) {
	const etherValue = Number(Uint.toBigInt(Ether.toU256(Wei.toEther(wei))));

	if (etherValue === 0) {
		return "Empty";
	}
	if (etherValue < 0.001) {
		return `${Uint.toString(Wei.toU256(wei))} wei`;
	}
	if (etherValue < 1) {
		return `${Uint.toString(Gwei.toU256(Wei.toGwei(wei)))} gwei`;
	}
	return `${formatBalance(wei)} ETH`;
}

const testBalances = [
	Wei.from(0n),
	Wei.from(100n),
	Wei.from(100_000_000n),
	Wei.from(100_000_000_000_000_000n),
	Wei.from(5_000_000_000_000_000_000n),
];

console.log("Smart formatting:");
for (const balance of testBalances) {
	console.log(`  ${displayWithThreshold(balance)}`);
}

console.log("\n=== Balance Comparison ===\n");

const balance1 = Wei.from(5_000_000_000_000_000_000n);
const balance2 = Wei.from(7_500_000_000_000_000_000n);

console.log("Account A:", formatBalance(balance1), "ETH");
console.log("Account B:", formatBalance(balance2), "ETH");

if (Uint.greaterThan(Wei.toU256(balance2), Wei.toU256(balance1))) {
	const diff = Uint.minus(Wei.toU256(balance2), Wei.toU256(balance1));
	console.log("Account B has", formatBalance(diff as Wei.Type), "ETH more");
} else if (Uint.lessThan(Wei.toU256(balance2), Wei.toU256(balance1))) {
	const diff = Uint.minus(Wei.toU256(balance1), Wei.toU256(balance2));
	console.log("Account A has", formatBalance(diff as Wei.Type), "ETH more");
} else {
	console.log("Balances are equal");
}
