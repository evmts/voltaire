/**
 * Example: EVM Gas Calculations
 *
 * Demonstrates:
 * - Intrinsic gas costs
 * - Memory expansion costs
 * - EIP-1559 base fee calculations
 * - Gas optimization patterns
 */

import * as Uint from '../../../src/primitives/Uint/index.js';

console.log('\n=== EVM Gas Calculations Example ===\n');

// Gas constants
const TX_BASE_COST = Uint.from(21000n); // Base transaction cost
const TX_DATA_ZERO_COST = Uint.from(4n); // Per zero byte in calldata
const TX_DATA_NONZERO_COST = Uint.from(16n); // Per non-zero byte in calldata
const MEMORY_COST_PER_WORD = Uint.from(3n); // Linear memory cost
const QUADRATIC_DENOMINATOR = Uint.from(512n); // For memory expansion
const BASE_FEE_MAX_CHANGE = Uint.from(8n); // EIP-1559 max base fee change
const ELASTICITY_MULTIPLIER = Uint.from(2n); // EIP-1559 elasticity

// 1. Intrinsic gas calculation
console.log('1. Intrinsic Gas Calculation');
console.log('   ------------------------');

function calculateIntrinsicGas(data: Uint8Array): typeof Uint.prototype {
	let gas = TX_BASE_COST;

	for (const byte of data) {
		if (byte === 0) {
			gas = gas.plus(TX_DATA_ZERO_COST);
		} else {
			gas = gas.plus(TX_DATA_NONZERO_COST);
		}
	}

	return gas;
}

// Empty transaction
const emptyData = new Uint8Array(0);
const emptyGas = calculateIntrinsicGas(emptyData);
console.log(`   Empty transaction: ${emptyGas.toString()} gas\n`);

// Data with zeros
const zeroData = new Uint8Array(100); // All zeros
const zeroGas = calculateIntrinsicGas(zeroData);
console.log(`   100 zero bytes: ${zeroGas.toString()} gas`);
console.log(`   (${TX_BASE_COST.toString()} base + ${TX_DATA_ZERO_COST.toString()} * 100)\n`);

// Data with non-zeros
const nonZeroData = new Uint8Array(100).fill(1);
const nonZeroGas = calculateIntrinsicGas(nonZeroData);
console.log(`   100 non-zero bytes: ${nonZeroGas.toString()} gas`);
console.log(`   (${TX_BASE_COST.toString()} base + ${TX_DATA_NONZERO_COST.toString()} * 100)\n`);

// Mixed data (simulating ERC20 transfer calldata)
const erc20Transfer = new Uint8Array(68); // 4 byte selector + 32 bytes address + 32 bytes amount
erc20Transfer[0] = 0xa9; // transfer(address,uint256) selector
erc20Transfer[1] = 0x05;
erc20Transfer[2] = 0x9c;
erc20Transfer[3] = 0xbb;
// Rest are mostly zeros (typical for addresses and amounts)

const erc20Gas = calculateIntrinsicGas(erc20Transfer);
console.log(`   ERC20 transfer: ${erc20Gas.toString()} gas\n`);

// 2. Memory expansion costs
console.log('2. Memory Expansion Costs');
console.log('   ---------------------');

function calculateMemoryCost(newSize: typeof Uint.prototype, oldSize: typeof Uint.prototype): typeof Uint.prototype {
	// Memory cost = linear + quadratic
	// cost(size) = (size / 32) * 3 + (size / 32)^2 / 512

	const newWords = newSize.plus(Uint.from(31n)).dividedBy(Uint.from(32n));
	const oldWords = oldSize.plus(Uint.from(31n)).dividedBy(Uint.from(32n));

	// Linear cost
	const newLinear = newWords.times(MEMORY_COST_PER_WORD);
	const oldLinear = oldWords.times(MEMORY_COST_PER_WORD);

	// Quadratic cost
	const newQuad = newWords.times(newWords).dividedBy(QUADRATIC_DENOMINATOR);
	const oldQuad = oldWords.times(oldWords).dividedBy(QUADRATIC_DENOMINATOR);

	const newTotal = newLinear.plus(newQuad);
	const oldTotal = oldLinear.plus(oldQuad);

	// Return expansion cost (difference)
	return newTotal.minus(oldTotal);
}

const expansions = [
	{ from: 0n, to: 32n, desc: '0 → 32 bytes (1 word)' },
	{ from: 32n, to: 64n, desc: '32 → 64 bytes (2 words)' },
	{ from: 0n, to: 1024n, desc: '0 → 1024 bytes (32 words)' },
	{ from: 1024n, to: 10000n, desc: '1024 → 10000 bytes (significant)' },
];

for (const { from, to, desc } of expansions) {
	const cost = calculateMemoryCost(Uint.from(to), Uint.from(from));
	console.log(`   ${desc}: ${cost.toString()} gas`);
}
console.log();

// 3. EIP-1559 base fee calculation
console.log('3. EIP-1559 Base Fee Calculation');
console.log('   ----------------------------');

function calculateNextBaseFee(
	currentBaseFee: typeof Uint.prototype,
	gasUsed: typeof Uint.prototype,
	gasTarget: typeof Uint.prototype,
): typeof Uint.prototype {
	if (gasUsed.equals(gasTarget)) {
		return currentBaseFee;
	}

	if (gasUsed.greaterThan(gasTarget)) {
		// Block is above target - increase base fee
		const delta = gasUsed.minus(gasTarget);
		const increase = currentBaseFee.times(delta).dividedBy(gasTarget).dividedBy(BASE_FEE_MAX_CHANGE);
		return currentBaseFee.plus(increase).maximum(Uint.ONE);
	} else {
		// Block is below target - decrease base fee
		const delta = gasTarget.minus(gasUsed);
		const decrease = currentBaseFee.times(delta).dividedBy(gasTarget).dividedBy(BASE_FEE_MAX_CHANGE);
		return currentBaseFee.minus(decrease);
	}
}

const baseFee = Uint.from(1000000000n); // 1 gwei
const gasLimit = Uint.from(30000000n); // 30M gas limit
const gasTarget = gasLimit.dividedBy(ELASTICITY_MULTIPLIER); // 15M target

console.log(`   Current base fee: ${baseFee.toString()} wei (1 gwei)`);
console.log(`   Gas limit: ${gasLimit.toString()}`);
console.log(`   Gas target: ${gasTarget.toString()}\n`);

const scenarios = [
	{ used: gasTarget, desc: 'At target (no change)' },
	{ used: Uint.from(29000000n), desc: 'High usage (~97%)' },
	{ used: Uint.from(1000000n), desc: 'Low usage (~3%)' },
];

for (const { used, desc } of scenarios) {
	const nextFee = calculateNextBaseFee(baseFee, used, gasTarget);
	const percentUsed = (Number(used.toBigInt()) / Number(gasLimit.toBigInt())) * 100;
	const change = nextFee.greaterThan(baseFee) ? nextFee.minus(baseFee) : baseFee.minus(nextFee);
	const changePercent = Number(change.times(Uint.from(10000n)).dividedBy(baseFee).toBigInt()) / 100;

	console.log(`   ${desc}:`);
	console.log(`   - Gas used: ${used.toString()} (${percentUsed.toFixed(1)}%)`);
	console.log(`   - Next base fee: ${nextFee.toString()} wei`);
	console.log(`   - Change: ${nextFee.greaterThan(baseFee) ? '+' : '-'}${changePercent.toFixed(2)}%\n`);
}

// 4. Gas optimization patterns
console.log('4. Gas Optimization Analysis');
console.log('   ------------------------');

// Storage operations
const SLOAD_COST = Uint.from(2100n); // Cold SLOAD
const SSTORE_SET = Uint.from(20000n); // Set storage from zero
const SSTORE_RESET = Uint.from(5000n); // Reset storage to zero

console.log(`   Storage operation costs:`);
console.log(`   - SLOAD (cold): ${SLOAD_COST.toString()} gas`);
console.log(`   - SSTORE (set): ${SSTORE_SET.toString()} gas`);
console.log(`   - SSTORE (reset): ${SSTORE_RESET.toString()} gas\n`);

// Compare storage vs memory
const numReads = Uint.from(10n);
const storageReads = SLOAD_COST.times(numReads);
const memoryReads = Uint.from(3n).times(numReads); // ~3 gas per memory read

console.log(`   ${numReads.toString()} reads comparison:`);
console.log(`   - From storage: ${storageReads.toString()} gas`);
console.log(`   - From memory: ${memoryReads.toString()} gas`);
console.log(`   - Savings: ${storageReads.minus(memoryReads).toString()} gas\n`);

// 5. Transaction cost estimation
console.log('5. Complete Transaction Cost');
console.log('   -----------------------');

const txGasPrice = Uint.from(50000000000n); // 50 gwei
const txGasUsed = Uint.from(100000n);
const txValue = Uint.from(1000000000000000000n); // 1 ETH

const gasCost = txGasUsed.times(txGasPrice);
const totalCost = gasCost.plus(txValue);

function weiToEther(wei: typeof Uint.prototype): string {
	return (Number(wei.toBigInt()) / 1e18).toFixed(6);
}

console.log(`   Gas price: 50 gwei`);
console.log(`   Gas used: ${txGasUsed.toString()}`);
console.log(`   Transaction value: ${weiToEther(txValue)} ETH\n`);

console.log(`   Gas cost: ${weiToEther(gasCost)} ETH`);
console.log(`   Total cost: ${weiToEther(totalCost)} ETH\n`);

// 6. Batch transaction savings
console.log('6. Batch Transaction Savings');
console.log('   ------------------------');

const singleTxCost = TX_BASE_COST;
const numTransfers = Uint.from(10n);
const separateCost = singleTxCost.times(numTransfers);

// Batch transfer saves base cost for each additional transfer
const batchCost = TX_BASE_COST.plus(Uint.from(25000n).times(numTransfers.minus(Uint.ONE)));

console.log(`   ${numTransfers.toString()} separate transfers:`);
console.log(`   - Cost: ${separateCost.toString()} gas\n`);

console.log(`   ${numTransfers.toString()} batched transfers:`);
console.log(`   - Cost: ${batchCost.toString()} gas`);
console.log(`   - Savings: ${separateCost.minus(batchCost).toString()} gas`);
console.log(`   - Percentage: ${Number(separateCost.minus(batchCost).times(Uint.from(100n)).dividedBy(separateCost).toBigInt())}%\n`);

console.log('=== Example Complete ===\n');
