/**
 * Example: EVM Gas Calculations
 *
 * Demonstrates:
 * - Intrinsic gas costs
 * - Memory expansion costs
 * - EIP-1559 base fee calculations
 * - Gas optimization patterns
 */

import { Uint256 as Uint } from "@tevm/voltaire";

// Gas constants
const TX_BASE_COST = Uint.from(21000n); // Base transaction cost
const TX_DATA_ZERO_COST = Uint.from(4n); // Per zero byte in calldata
const TX_DATA_NONZERO_COST = Uint.from(16n); // Per non-zero byte in calldata
const MEMORY_COST_PER_WORD = Uint.from(3n); // Linear memory cost
const QUADRATIC_DENOMINATOR = Uint.from(512n); // For memory expansion
const BASE_FEE_MAX_CHANGE = Uint.from(8n); // EIP-1559 max base fee change
const ELASTICITY_MULTIPLIER = Uint.from(2n); // EIP-1559 elasticity

function calculateIntrinsicGas(data: Uint8Array): typeof Uint.prototype {
	let gas = TX_BASE_COST;

	for (const byte of data) {
		if (byte === 0) {
			gas = Uint.plus(gas, TX_DATA_ZERO_COST);
		} else {
			gas = Uint.plus(gas, TX_DATA_NONZERO_COST);
		}
	}

	return gas;
}

// Empty transaction
const emptyData = new Uint8Array(0);
const emptyGas = calculateIntrinsicGas(emptyData);

// Data with zeros
const zeroData = new Uint8Array(100); // All zeros
const zeroGas = calculateIntrinsicGas(zeroData);

// Data with non-zeros
const nonZeroData = new Uint8Array(100).fill(1);
const nonZeroGas = calculateIntrinsicGas(nonZeroData);

// Mixed data (simulating ERC20 transfer calldata)
const erc20Transfer = new Uint8Array(68); // 4 byte selector + 32 bytes address + 32 bytes amount
erc20Transfer[0] = 0xa9; // transfer(address,uint256) selector
erc20Transfer[1] = 0x05;
erc20Transfer[2] = 0x9c;
erc20Transfer[3] = 0xbb;
// Rest are mostly zeros (typical for addresses and amounts)

const erc20Gas = calculateIntrinsicGas(erc20Transfer);

function calculateMemoryCost(
	newSize: typeof Uint.prototype,
	oldSize: typeof Uint.prototype,
): typeof Uint.prototype {
	// Memory cost = linear + quadratic
	// cost(size) = (size / 32) * 3 + (size / 32)^2 / 512

	const newWords = Uint.dividedBy(
		Uint.plus(newSize, Uint.from(31n)),
		Uint.from(32n),
	);
	const oldWords = Uint.dividedBy(
		Uint.plus(oldSize, Uint.from(31n)),
		Uint.from(32n),
	);

	// Linear cost
	const newLinear = Uint.times(newWords, MEMORY_COST_PER_WORD);
	const oldLinear = Uint.times(oldWords, MEMORY_COST_PER_WORD);

	// Quadratic cost
	const newQuad = Uint.dividedBy(
		Uint.times(newWords, newWords),
		QUADRATIC_DENOMINATOR,
	);
	const oldQuad = Uint.dividedBy(
		Uint.times(oldWords, oldWords),
		QUADRATIC_DENOMINATOR,
	);

	const newTotal = Uint.plus(newLinear, newQuad);
	const oldTotal = Uint.plus(oldLinear, oldQuad);

	// Return expansion cost (difference)
	return Uint.minus(newTotal, oldTotal);
}

const expansions = [
	{ from: 0n, to: 32n, desc: "0 → 32 bytes (1 word)" },
	{ from: 32n, to: 64n, desc: "32 → 64 bytes (2 words)" },
	{ from: 0n, to: 1024n, desc: "0 → 1024 bytes (32 words)" },
	{ from: 1024n, to: 10000n, desc: "1024 → 10000 bytes (significant)" },
];

for (const { from, to, desc } of expansions) {
	const cost = calculateMemoryCost(Uint.from(to), Uint.from(from));
}

function calculateNextBaseFee(
	currentBaseFee: typeof Uint.prototype,
	gasUsed: typeof Uint.prototype,
	gasTarget: typeof Uint.prototype,
): typeof Uint.prototype {
	if (Uint.equals(gasUsed, gasTarget)) {
		return currentBaseFee;
	}

	if (Uint.greaterThan(gasUsed, gasTarget)) {
		// Block is above target - increase base fee
		const delta = Uint.minus(gasUsed, gasTarget);
		const increase = Uint.dividedBy(
			Uint.dividedBy(Uint.times(currentBaseFee, delta), gasTarget),
			BASE_FEE_MAX_CHANGE,
		);
		return Uint.maximum(Uint.plus(currentBaseFee, increase), Uint.ONE);
	}
	// Block is below target - decrease base fee
	const delta = Uint.minus(gasTarget, gasUsed);
	const decrease = Uint.dividedBy(
		Uint.dividedBy(Uint.times(currentBaseFee, delta), gasTarget),
		BASE_FEE_MAX_CHANGE,
	);
	return Uint.minus(currentBaseFee, decrease);
}

const baseFee = Uint.from(1000000000n); // 1 gwei
const gasLimit = Uint.from(30000000n); // 30M gas limit
const gasTarget = Uint.dividedBy(gasLimit, ELASTICITY_MULTIPLIER); // 15M target

const scenarios = [
	{ used: gasTarget, desc: "At target (no change)" },
	{ used: Uint.from(29000000n), desc: "High usage (~97%)" },
	{ used: Uint.from(1000000n), desc: "Low usage (~3%)" },
];

for (const { used, desc } of scenarios) {
	const nextFee = calculateNextBaseFee(baseFee, used, gasTarget);
	const percentUsed =
		(Number(Uint.toBigInt(used)) / Number(Uint.toBigInt(gasLimit))) * 100;
	const change = Uint.greaterThan(nextFee, baseFee)
		? Uint.minus(nextFee, baseFee)
		: Uint.minus(baseFee, nextFee);
	const changePercent =
		Number(
			Uint.toBigInt(
				Uint.dividedBy(Uint.times(change, Uint.from(10000n)), baseFee),
			),
		) / 100;
}

// Storage operations
const SLOAD_COST = Uint.from(2100n); // Cold SLOAD
const SSTORE_SET = Uint.from(20000n); // Set storage from zero
const SSTORE_RESET = Uint.from(5000n); // Reset storage to zero

// Compare storage vs memory
const numReads = Uint.from(10n);
const storageReads = Uint.times(SLOAD_COST, numReads);
const memoryReads = Uint.times(Uint.from(3n), numReads); // ~3 gas per memory read

const txGasPrice = Uint.from(50000000000n); // 50 gwei
const txGasUsed = Uint.from(100000n);
const txValue = Uint.from(1000000000000000000n); // 1 ETH

const gasCost = Uint.times(txGasUsed, txGasPrice);
const totalCost = Uint.plus(gasCost, txValue);

function weiToEther(wei: typeof Uint.prototype): string {
	return (Number(Uint.toBigInt(wei)) / 1e18).toFixed(6);
}

const singleTxCost = TX_BASE_COST;
const numTransfers = Uint.from(10n);
const separateCost = Uint.times(singleTxCost, numTransfers);

// Batch transfer saves base cost for each additional transfer
const batchCost = Uint.plus(
	TX_BASE_COST,
	Uint.times(Uint.from(25000n), Uint.minus(numTransfers, Uint.ONE)),
);
