import * as Wei from "../../../primitives/Denomination/Wei.js";
import * as Gwei from "../../../primitives/Denomination/Gwei.js";
import * as Ether from "../../../primitives/Denomination/Ether.js";
import * as Uint from "../../../primitives/Uint/index.js";

// Example: Formatting denominations for display

console.log("=== Formatting Wei Values ===\n");

const smallWei = Wei.from(123n);
const mediumWei = Wei.from(456_789n);
const largeWei = Wei.from(1_234_567_890_123_456_789n);

// Format wei with separators
function formatWei(wei: Wei.Type): string {
	const str = Uint.toString(Wei.toU256(wei));
	return str.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

console.log("Wei values with formatting:");
console.log(formatWei(smallWei), "wei");
console.log(formatWei(mediumWei), "wei");
console.log(formatWei(largeWei), "wei");

console.log("\n=== Formatting Gwei Values ===\n");

const lowGas = Gwei.from(5n);
const mediumGas = Gwei.from(30n);
const highGas = Gwei.from(150n);
const extremeGas = Gwei.from(1000n);

function formatGwei(gwei: Gwei.Type): string {
	return Uint.toString(Gwei.toU256(gwei));
}

console.log("Gas prices:");
console.log(formatGwei(lowGas), "gwei (low)");
console.log(formatGwei(mediumGas), "gwei (medium)");
console.log(formatGwei(highGas), "gwei (high)");
console.log(formatGwei(extremeGas), "gwei (extreme)");

console.log("\n=== Formatting Ether Values ===\n");

const smallBalance = Ether.from(1n);
const mediumBalance = Ether.from(123n);
const largeBalance = Ether.from(45678n);
const whaleBalance = Ether.from(1000000n);

function formatEther(ether: Ether.Type): string {
	const str = Uint.toString(Ether.toU256(ether));
	return str.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

console.log("Balances:");
console.log(formatEther(smallBalance), "ETH");
console.log(formatEther(mediumBalance), "ETH");
console.log(formatEther(largeBalance), "ETH");
console.log(formatEther(whaleBalance), "ETH");

console.log("\n=== Multi-Unit Display ===\n");

// Display same value in multiple units
const value = Wei.from(1_500_000_000_000_000_000n);

console.log("Value representations:");
console.log("Wei:  ", formatWei(value));
console.log("Gwei: ", formatGwei(Wei.toGwei(value)));
console.log("Ether:", formatEther(Wei.toEther(value)));

console.log("\n=== Transaction Display ===\n");

const txValue = Wei.from(250_000_000_000_000_000n);
const gasPrice = Gwei.from(35n);
const gasUsed = 21000n;
const gasCostWei = Uint.times(Gwei.toU256(gasPrice), Uint.from(gasUsed));

function displayTransaction(value: Wei.Type, gasCost: bigint) {
	console.log("Transaction details:");
	console.log("  Value:    ", formatWei(value), "wei");
	console.log("            ", formatEther(Wei.toEther(value)), "ETH");
	console.log("  Gas cost: ", formatWei(gasCost as Wei.Type), "wei");
	console.log(
		"            ",
		formatEther(Wei.toEther(gasCost as Wei.Type)),
		"ETH",
	);

	const total = Uint.plus(Wei.toU256(value), Uint.from(gasCost));
	console.log("  Total:    ", formatWei(total as Wei.Type), "wei");
	console.log(
		"            ",
		formatEther(Wei.toEther(total as Wei.Type)),
		"ETH",
	);
}

displayTransaction(txValue, gasCostWei);

console.log("\n=== Wallet Display ===\n");

const walletBalance = Wei.from(3_750_000_000_000_000_000n);

function displayBalance(balance: Wei.Type) {
	const ether = Wei.toEther(balance);
	const gwei = Wei.toGwei(balance);

	console.log("Balance display:");
	console.log("  Primary:  ", formatEther(ether), "ETH");
	console.log("  Detailed: ", formatGwei(gwei), "gwei");
	console.log("  Raw:      ", formatWei(balance), "wei");
}

displayBalance(walletBalance);

console.log("\n=== Gas Price Display ===\n");

function displayGasPrice(gwei: Gwei.Type) {
	const wei = Gwei.toWei(gwei);
	const priceStr = Uint.toString(Gwei.toU256(gwei));

	console.log(`Gas Price: ${priceStr} gwei`);
	console.log(`  In wei: ${formatWei(wei)}`);

	const standardTx = Uint.times(Gwei.toU256(gwei), Uint.from(21000n));
	console.log(`  Transfer cost: ${formatGwei(standardTx as Gwei.Type)} gwei`);
	console.log(
		`                 ${formatEther(Gwei.toEther(standardTx as Gwei.Type))} ETH`,
	);
}

displayGasPrice(Gwei.from(42n));

console.log("\n=== Smart Contract Value Display ===\n");

const contractBalance = Wei.from(125_000_000_000_000_000_000_000n);

function displayContractValue(wei: Wei.Type) {
	const ether = Wei.toEther(wei);
	console.log("Contract Balance:");
	console.log("  ", formatEther(ether), "ETH");
	console.log("  ", formatWei(wei), "wei");
}

displayContractValue(contractBalance);

console.log("\n=== Percentage Display ===\n");

const totalSupply = Ether.from(100000n);
const userBalance = Ether.from(2500n);

function displayPercentage(part: Ether.Type, whole: Ether.Type) {
	const partBigInt = Uint.toBigInt(Ether.toU256(part));
	const wholeBigInt = Uint.toBigInt(Ether.toU256(whole));
	const percentage = (Number(partBigInt) / Number(wholeBigInt)) * 100;

	console.log("Holdings:");
	console.log("  Amount:", formatEther(part), "ETH");
	console.log("  Total: ", formatEther(whole), "ETH");
	console.log("  Share: ", percentage.toFixed(2), "%");
}

displayPercentage(userBalance, totalSupply);

console.log("\n=== Compact Notation ===\n");

function compactEther(ether: Ether.Type): string {
	const value = Number(Uint.toBigInt(Ether.toU256(ether)));

	if (value >= 1_000_000) {
		return (value / 1_000_000).toFixed(2) + "M ETH";
	}
	if (value >= 1_000) {
		return (value / 1_000).toFixed(2) + "K ETH";
	}
	return value.toString() + " ETH";
}

console.log("Compact notation:");
console.log(compactEther(Ether.from(500n)));
console.log(compactEther(Ether.from(5_000n)));
console.log(compactEther(Ether.from(50_000n)));
console.log(compactEther(Ether.from(5_000_000n)));
