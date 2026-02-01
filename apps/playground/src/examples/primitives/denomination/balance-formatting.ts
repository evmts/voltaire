import { Ether, Gwei, Uint, Wei } from "@tevm/voltaire";
const balances = [
	{ name: "Empty", wei: Wei(0n) },
	{ name: "Dust", wei: Wei(1000n) },
	{ name: "Small", wei: Wei(100_000_000_000_000_000n) },
	{ name: "Medium", wei: Wei(5_000_000_000_000_000_000n) },
	{ name: "Large", wei: Wei(150_000_000_000_000_000_000n) },
	{ name: "Whale", wei: Wei(10_000_000_000_000_000_000_000n) },
];

function formatBalance(wei: Wei.Type): string {
	const ether = Wei.toEther(wei);
	const etherStr = Uint.toString(Ether.toU256(ether));
	return etherStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

for (const { name, wei } of balances) {
	const formatted = formatBalance(wei);
}

const accounts = [
	{
		address: "0x742d35Cc...f44e",
		balance: Wei(5_250_000_000_000_000_000n),
	},
	{
		address: "0xd8da6bf2...6045",
		balance: Wei(12_750_000_000_000_000_000n),
	},
	{
		address: "0x5aAed593...0fbd",
		balance: Wei(3_500_000_000_000_000_000n),
	},
];
for (const { address, balance } of accounts) {
}

const totalBalance = accounts.reduce((sum, acc) => {
	return Uint.plus(sum, Wei.toU256(acc.balance));
}, Uint(0n)) as Wei.Type;

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
for (const { symbol, decimals, balance } of tokenBalances) {
}

const history = [
	{ date: "2024-01-01", balance: Wei(10_000_000_000_000_000_000n) },
	{ date: "2024-02-01", balance: Wei(12_500_000_000_000_000_000n) },
	{ date: "2024-03-01", balance: Wei(11_750_000_000_000_000_000n) },
	{ date: "2024-04-01", balance: Wei(15_000_000_000_000_000_000n) },
];
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
		const absDiff = isPositive ? diff : Uint.minus(Uint(0n), diff);
		const diffEther = Wei.toEther(absDiff as Wei.Type);
		change = ` (${symbol}${Uint.toString(Ether.toU256(diffEther))} ETH)`;
	}
	previous = balance;
}

const totalSupply = Wei(100_000_000_000_000_000_000_000n);
const userBalance = Wei(2_500_000_000_000_000_000_000n);

function calculatePercentage(part: Wei.Type, whole: Wei.Type): string {
	const partBigInt = Uint.toBigInt(Wei.toU256(part));
	const wholeBigInt = Uint.toBigInt(Wei.toU256(whole));
	const percentage = (Number(partBigInt) / Number(wholeBigInt)) * 100;
	return percentage.toFixed(4);
}

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
	Wei(500_000_000_000_000_000n),
	Wei(5_000_000_000_000_000_000_000n),
	Wei(50_000_000_000_000_000_000_000n),
	Wei(500_000_000_000_000_000_000_000n),
];
for (const balance of largeBalances) {
}

const currentBalance = Wei(10_000_000_000_000_000_000n);
const pendingOut = Wei(2_000_000_000_000_000_000n);
const pendingIn = Wei(500_000_000_000_000_000n);

const projected = Uint.minus(
	Wei.toU256(currentBalance),
	Wei.toU256(pendingOut),
);
const projectedWithIn = Uint.plus(projected, Wei.toU256(pendingIn));

// Display balance in multiple units
const balance = Wei(7_500_000_000_000_000_000n);

const zeroBalance = Wei(0n);
const microBalance = Wei(100n);

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
	Wei(0n),
	Wei(100n),
	Wei(100_000_000n),
	Wei(100_000_000_000_000_000n),
	Wei(5_000_000_000_000_000_000n),
];
for (const balance of testBalances) {
}

const balance1 = Wei(5_000_000_000_000_000_000n);
const balance2 = Wei(7_500_000_000_000_000_000n);

if (Uint.greaterThan(Wei.toU256(balance2), Wei.toU256(balance1))) {
	const diff = Uint.minus(Wei.toU256(balance2), Wei.toU256(balance1));
} else if (Uint.lessThan(Wei.toU256(balance2), Wei.toU256(balance1))) {
	const diff = Uint.minus(Wei.toU256(balance1), Wei.toU256(balance2));
} else {
}
