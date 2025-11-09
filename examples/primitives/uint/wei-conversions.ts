/**
 * Example: Wei and Ether Conversions
 *
 * Demonstrates:
 * - Converting between wei, gwei, and ether
 * - Working with ETH denominations
 * - Gas price calculations
 * - Transaction cost calculations
 */

import * as Uint from '../../../src/primitives/Uint/index.js';

console.log('\n=== Wei and Ether Conversions Example ===\n');

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

// 1. Basic conversions
console.log('1. Basic Denomination Conversions');
console.log('   ------------------------------');

const oneEtherInWei = WEI_PER_ETHER;
const oneGweiInWei = WEI_PER_GWEI;

console.log(`   1 Ether = ${oneEtherInWei.toString()} wei`);
console.log(`   1 Gwei  = ${oneGweiInWei.toString()} wei\n`);

// Convert various amounts
const amounts = [
	{ wei: Uint.from(1000000000n), desc: '1 gwei' },
	{ wei: Uint.from(1000000000000000000n), desc: '1 ether' },
	{ wei: Uint.from(250000000000000000n), desc: '0.25 ether' },
];

for (const { wei, desc } of amounts) {
	console.log(`   ${desc}:`);
	console.log(`   - Wei:   ${wei.toString()}`);
	console.log(`   - Gwei:  ${weiToGwei(wei).toString()}`);
	console.log(`   - Ether: ${weiToEther(wei)}\n`);
}

// 2. Gas price calculations
console.log('2. Gas Price Calculations');
console.log('   ---------------------');

const gasPriceGwei = Uint.from(50n); // 50 gwei
const gasPriceWei = gweiToWei(gasPriceGwei);

console.log(`   Gas price: ${gasPriceGwei.toString()} gwei`);
console.log(`   Gas price: ${gasPriceWei.toString()} wei\n`);

// Calculate costs for different transaction types
const simpleTransferGas = Uint.from(21000n);
const erc20TransferGas = Uint.from(65000n);
const uniswapSwapGas = Uint.from(150000n);

function calculateGasCost(gasUsed: typeof Uint.prototype, gasPrice: typeof Uint.prototype): typeof Uint.prototype {
	return gasUsed.times(gasPrice);
}

const transfers = [
	{ type: 'Simple transfer', gas: simpleTransferGas },
	{ type: 'ERC20 transfer', gas: erc20TransferGas },
	{ type: 'Uniswap swap', gas: uniswapSwapGas },
];

for (const { type, gas } of transfers) {
	const cost = calculateGasCost(gas, gasPriceWei);
	console.log(`   ${type}:`);
	console.log(`   - Gas used: ${gas.toString()}`);
	console.log(`   - Cost: ${weiToEther(cost)} ETH (${weiToGwei(cost).toString()} gwei)\n`);
}

// 3. EIP-1559 transaction costs
console.log('3. EIP-1559 Transaction Costs');
console.log('   -------------------------');

const baseFeeGwei = Uint.from(30n);
const priorityFeeGwei = Uint.from(2n);
const maxFeeGwei = Uint.from(50n);

const baseFeeWei = gweiToWei(baseFeeGwei);
const priorityFeeWei = gweiToWei(priorityFeeGwei);
const maxFeeWei = gweiToWei(maxFeeGwei);

console.log(`   Base fee: ${baseFeeGwei.toString()} gwei`);
console.log(`   Priority fee: ${priorityFeeGwei.toString()} gwei`);
console.log(`   Max fee: ${maxFeeGwei.toString()} gwei\n`);

// Effective gas price = min(maxFeePerGas, baseFee + priorityFee)
const effectiveFee = baseFeeWei.plus(priorityFeeWei).minimum(maxFeeWei);
const effectiveFeeGwei = weiToGwei(effectiveFee);

console.log(`   Effective gas price: ${effectiveFeeGwei.toString()} gwei\n`);

const txGas = Uint.from(21000n);
const txCost = calculateGasCost(txGas, effectiveFee);

console.log(`   Transaction cost:`);
console.log(`   - Gas used: ${txGas.toString()}`);
console.log(`   - Total cost: ${weiToEther(txCost)} ETH\n`);

// 4. Wallet balance calculations
console.log('4. Wallet Balance Calculations');
console.log('   --------------------------');

const balance = etherToWei(5.5); // 5.5 ETH
const txValue = etherToWei(1.0); // 1 ETH
const txGasCost = calculateGasCost(Uint.from(21000n), gweiToWei(Uint.from(50n)));

console.log(`   Current balance: ${weiToEther(balance)} ETH`);
console.log(`   Transaction amount: ${weiToEther(txValue)} ETH`);
console.log(`   Gas cost: ${weiToEther(txGasCost)} ETH\n`);

const totalCost = txValue.plus(txGasCost);
const remainingBalance = balance.minus(totalCost);

console.log(`   Total cost: ${weiToEther(totalCost)} ETH`);
console.log(`   Remaining balance: ${weiToEther(remainingBalance)} ETH\n`);

// Check if sufficient balance
const hasSufficientBalance = balance.greaterThanOrEqual(totalCost);
console.log(`   Sufficient balance? ${hasSufficientBalance}\n`);

// 5. Staking rewards calculation
console.log('5. Staking Rewards Calculation');
console.log('   --------------------------');

const stakedAmount = etherToWei(32); // 32 ETH (validator)
const annualRewardRate = 0.04; // 4% APR
const daysStaked = 365;

// Calculate rewards: staked * rate * (days / 365)
const rewardMultiplier = Math.floor(annualRewardRate * (daysStaked / 365) * 1e18);
const rewards = stakedAmount.times(Uint.from(BigInt(rewardMultiplier))).dividedBy(WEI_PER_ETHER);

console.log(`   Staked amount: ${weiToEther(stakedAmount)} ETH`);
console.log(`   Annual rate: ${(annualRewardRate * 100).toFixed(2)}%`);
console.log(`   Days staked: ${daysStaked}`);
console.log(`   Rewards earned: ${weiToEther(rewards)} ETH\n`);

const totalStaked = stakedAmount.plus(rewards);
console.log(`   Total after rewards: ${weiToEther(totalStaked)} ETH\n`);

// 6. Gas fee comparison
console.log('6. Gas Fee Comparison');
console.log('   -----------------');

const gasPrices = [20n, 50n, 100n, 200n]; // gwei
const gasAmount = Uint.from(100000n);

console.log(`   Gas amount: ${gasAmount.toString()}\n`);

for (const priceGwei of gasPrices) {
	const price = gweiToWei(Uint.from(priceGwei));
	const cost = calculateGasCost(gasAmount, price);

	console.log(`   @ ${priceGwei} gwei:`);
	console.log(`   - Cost: ${weiToEther(cost)} ETH`);
	console.log(`   - USD (@ $2000/ETH): $${(Number(weiToEther(cost)) * 2000).toFixed(2)}\n`);
}

// 7. Unit testing helpers
console.log('7. Precise Wei Amounts');
console.log('   ------------------');

// Often need exact wei amounts for testing
const exactAmounts = [
	Uint.from(1n), // 1 wei
	Uint.from(1000n), // 1000 wei
	Uint.from(10n ** 9n), // 1 gwei
	Uint.from(10n ** 18n), // 1 ether
];

for (const amount of exactAmounts) {
	console.log(`   ${amount.toString()} wei`);
	console.log(`   - Hex: ${amount.toHex(false)}`);
	console.log(`   - Gwei: ${weiToGwei(amount).toString()}`);
	console.log(`   - Ether: ${weiToEther(amount)}\n`);
}

console.log('=== Example Complete ===\n');
