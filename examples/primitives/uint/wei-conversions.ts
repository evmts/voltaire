/**
 * Example: Wei and Ether Conversions
 *
 * Demonstrates:
 * - Converting between wei, gwei, and ether
 * - Working with ETH denominations
 * - Gas price calculations
 * - Transaction cost calculations
 */

import * as Uint from "../../../src/primitives/Uint/index.js";

// Constants for Ethereum denominations
const WEI_PER_GWEI = Uint.from(10n ** 9n); // 1 gwei = 10^9 wei
const WEI_PER_ETHER = Uint.from(10n ** 18n); // 1 ether = 10^18 wei

// Conversion helpers
function weiToGwei(wei: typeof Uint.prototype): typeof Uint.prototype {
	return wei.dividedBy(WEI_PER_GWEI);
}

function gweiToWei(gwei: typeof Uint.prototype): typeof Uint.prototype {
	return gwei.times(WEI_PER_GWEI);
}

function weiToEther(wei: typeof Uint.prototype): string {
	const weiNum = Number(wei.toBigInt());
	const etherNum = weiNum / 1e18;
	return etherNum.toFixed(6);
}

function etherToWei(ether: number): typeof Uint.prototype {
	const wei = BigInt(Math.floor(ether * 1e18));
	return Uint.from(wei);
}

const oneEtherInWei = WEI_PER_ETHER;
const oneGweiInWei = WEI_PER_GWEI;

// Convert various amounts
const amounts = [
	{ wei: Uint.from(1000000000n), desc: "1 gwei" },
	{ wei: Uint.from(1000000000000000000n), desc: "1 ether" },
	{ wei: Uint.from(250000000000000000n), desc: "0.25 ether" },
];

for (const { wei, desc } of amounts) {
}

const gasPriceGwei = Uint.from(50n); // 50 gwei
const gasPriceWei = gweiToWei(gasPriceGwei);

// Calculate costs for different transaction types
const simpleTransferGas = Uint.from(21000n);
const erc20TransferGas = Uint.from(65000n);
const uniswapSwapGas = Uint.from(150000n);

function calculateGasCost(
	gasUsed: typeof Uint.prototype,
	gasPrice: typeof Uint.prototype,
): typeof Uint.prototype {
	return gasUsed.times(gasPrice);
}

const transfers = [
	{ type: "Simple transfer", gas: simpleTransferGas },
	{ type: "ERC20 transfer", gas: erc20TransferGas },
	{ type: "Uniswap swap", gas: uniswapSwapGas },
];

for (const { type, gas } of transfers) {
	const cost = calculateGasCost(gas, gasPriceWei);
}

const baseFeeGwei = Uint.from(30n);
const priorityFeeGwei = Uint.from(2n);
const maxFeeGwei = Uint.from(50n);

const baseFeeWei = gweiToWei(baseFeeGwei);
const priorityFeeWei = gweiToWei(priorityFeeGwei);
const maxFeeWei = gweiToWei(maxFeeGwei);

// Effective gas price = min(maxFeePerGas, baseFee + priorityFee)
const effectiveFee = baseFeeWei.plus(priorityFeeWei).minimum(maxFeeWei);
const effectiveFeeGwei = weiToGwei(effectiveFee);

const txGas = Uint.from(21000n);
const txCost = calculateGasCost(txGas, effectiveFee);

const balance = etherToWei(5.5); // 5.5 ETH
const txValue = etherToWei(1.0); // 1 ETH
const txGasCost = calculateGasCost(
	Uint.from(21000n),
	gweiToWei(Uint.from(50n)),
);

const totalCost = txValue.plus(txGasCost);
const remainingBalance = balance.minus(totalCost);

// Check if sufficient balance
const hasSufficientBalance = balance.greaterThanOrEqual(totalCost);

const stakedAmount = etherToWei(32); // 32 ETH (validator)
const annualRewardRate = 0.04; // 4% APR
const daysStaked = 365;

// Calculate rewards: staked * rate * (days / 365)
const rewardMultiplier = Math.floor(
	annualRewardRate * (daysStaked / 365) * 1e18,
);
const rewards = stakedAmount
	.times(Uint.from(BigInt(rewardMultiplier)))
	.dividedBy(WEI_PER_ETHER);

const totalStaked = stakedAmount.plus(rewards);

const gasPrices = [20n, 50n, 100n, 200n]; // gwei
const gasAmount = Uint.from(100000n);

for (const priceGwei of gasPrices) {
	const price = gweiToWei(Uint.from(priceGwei));
	const cost = calculateGasCost(gasAmount, price);
}

// Often need exact wei amounts for testing
const exactAmounts = [
	Uint.from(1n), // 1 wei
	Uint.from(1000n), // 1000 wei
	Uint.from(10n ** 9n), // 1 gwei
	Uint.from(10n ** 18n), // 1 ether
];

for (const amount of exactAmounts) {
}
