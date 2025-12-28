import { Ether, Gwei, Uint, Wei } from "voltaire";
const smallWei = Wei.from(123n);
const mediumWei = Wei.from(456_789n);
const largeWei = Wei.from(1_234_567_890_123_456_789n);

// Format wei with separators
function formatWei(wei: Wei.Type): string {
	const str = Uint.toString(Wei.toU256(wei));
	return str.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const lowGas = Gwei.from(5n);
const mediumGas = Gwei.from(30n);
const highGas = Gwei.from(150n);
const extremeGas = Gwei.from(1000n);

function formatGwei(gwei: Gwei.Type): string {
	return Uint.toString(Gwei.toU256(gwei));
}

const smallBalance = Ether.from(1n);
const mediumBalance = Ether.from(123n);
const largeBalance = Ether.from(45678n);
const whaleBalance = Ether.from(1000000n);

function formatEther(ether: Ether.Type): string {
	const str = Uint.toString(Ether.toU256(ether));
	return str.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Display same value in multiple units
const value = Wei.from(1_500_000_000_000_000_000n);

const txValue = Wei.from(250_000_000_000_000_000n);
const gasPrice = Gwei.from(35n);
const gasUsed = 21000n;
const gasCostWei = Uint.times(Gwei.toU256(gasPrice), Uint.from(gasUsed));

function displayTransaction(value: Wei.Type, gasCost: bigint) {
	const total = Uint.plus(Wei.toU256(value), Uint.from(gasCost));
}

displayTransaction(txValue, gasCostWei);

const walletBalance = Wei.from(3_750_000_000_000_000_000n);

function displayBalance(balance: Wei.Type) {
	const ether = Wei.toEther(balance);
	const gwei = Wei.toGwei(balance);
}

displayBalance(walletBalance);

function displayGasPrice(gwei: Gwei.Type) {
	const wei = Gwei.toWei(gwei);
	const priceStr = Uint.toString(Gwei.toU256(gwei));

	const standardTx = Uint.times(Gwei.toU256(gwei), Uint.from(21000n));
}

displayGasPrice(Gwei.from(42n));

const contractBalance = Wei.from(125_000_000_000_000_000_000_000n);

function displayContractValue(wei: Wei.Type) {
	const ether = Wei.toEther(wei);
}

displayContractValue(contractBalance);

const totalSupply = Ether.from(100000n);
const userBalance = Ether.from(2500n);

function displayPercentage(part: Ether.Type, whole: Ether.Type) {
	const partBigInt = Uint.toBigInt(Ether.toU256(part));
	const wholeBigInt = Uint.toBigInt(Ether.toU256(whole));
	const percentage = (Number(partBigInt) / Number(wholeBigInt)) * 100;
}

displayPercentage(userBalance, totalSupply);

function compactEther(ether: Ether.Type): string {
	const value = Number(Uint.toBigInt(Ether.toU256(ether)));

	if (value >= 1_000_000) {
		return `${(value / 1_000_000).toFixed(2)}M ETH`;
	}
	if (value >= 1_000) {
		return `${(value / 1_000).toFixed(2)}K ETH`;
	}
	return `${value.toString()} ETH`;
}
