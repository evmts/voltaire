import { MaxFeePerGas } from "voltaire";

const baseFee = 45n; // Gwei
const maxPriorityFee = 2n; // Gwei - tip to validators
const maxFeePerGas = MaxFeePerGas.fromGwei(50n);

// Validate relationship
const effectiveFee = baseFee + maxPriorityFee;
const isValid = MaxFeePerGas.toGwei(maxFeePerGas) >= maxPriorityFee;
const canPay = MaxFeePerGas.toGwei(maxFeePerGas) >= effectiveFee;
const conservativeBase = 50n;
const conservativePriority = 1n;
const conservativeMax = MaxFeePerGas.fromGwei(
	conservativeBase + conservativePriority + 5n,
);
const aggressiveBase = 50n;
const aggressivePriority = 10n; // Higher tip for faster inclusion
const aggressiveMax = MaxFeePerGas.fromGwei(
	aggressiveBase + aggressivePriority + 20n,
);
const invalidMaxFee = MaxFeePerGas.fromGwei(5n);
const invalidPriorityFee = 10n;
const invalidCheck = MaxFeePerGas.toGwei(invalidMaxFee) >= invalidPriorityFee;
const constantBase = 45n;
const constantMax = MaxFeePerGas.fromGwei(55n);
const gasUsed = 21000n;

const priorities = [1n, 2n, 5n, 10n];
for (const priority of priorities) {
	const effectiveFeeValue = constantBase + priority;
	const actualMax =
		effectiveFeeValue < MaxFeePerGas.toGwei(constantMax)
			? effectiveFeeValue
			: MaxFeePerGas.toGwei(constantMax);
	const cost = actualMax * gasUsed;
}
const cappedMaxFee = MaxFeePerGas.fromGwei(50n);
const highPriority = 20n;
const cappedBase = 40n;

const intendedEffective = cappedBase + highPriority; // 60 Gwei
const actualEffective =
	intendedEffective > MaxFeePerGas.toGwei(cappedMaxFee)
		? MaxFeePerGas.toGwei(cappedMaxFee)
		: intendedEffective;
