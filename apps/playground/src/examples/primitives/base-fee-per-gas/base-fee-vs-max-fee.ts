import { BaseFeePerGas } from "@tevm/voltaire";

// Current network state
const currentBase = BaseFeePerGas.fromGwei(25n);

// User sets these values
const maxPriorityFee = 2n; // Tip to miner (gwei)
const maxFeePerGas = 30n; // Max willing to pay (gwei)

// Calculate actual fees
const actualFee = BaseFeePerGas.toGwei(currentBase) + maxPriorityFee;
const effectiveFee = actualFee < maxFeePerGas ? actualFee : maxFeePerGas;
const burned = BaseFeePerGas.toGwei(currentBase);
const tip = effectiveFee - burned;
const normalBase = BaseFeePerGas.fromGwei(20n);
const normalMax = 30n;
const normalPriority = 2n;
const normalEffective = BaseFeePerGas.toGwei(normalBase) + normalPriority;
const spikeBase = BaseFeePerGas.fromGwei(35n); // Spike above max
const spikeMax = 30n;
const spikePriority = 2n;
const conservativeBase = BaseFeePerGas.fromGwei(15n);
const conservativeMax = 20n; // Low max (cost conscious)
const conservativePriority = 1n; // Low tip

const conservativeEffective =
	BaseFeePerGas.toGwei(conservativeBase) + conservativePriority;
const urgentBase = BaseFeePerGas.fromGwei(30n);
const urgentMax = 100n; // High max (willing to pay)
const urgentPriority = 10n; // High tip (priority)

const urgentEffective = BaseFeePerGas.toGwei(urgentBase) + urgentPriority;
