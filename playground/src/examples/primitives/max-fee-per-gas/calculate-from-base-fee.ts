import { MaxFeePerGas } from "voltaire";

// Base fee increases 12.5% per block when full
// Base fee decreases 12.5% per block when empty
const BASE_FEE_MAX_CHANGE = 1125n; // 12.5% = 1.125x
const BASE_FEE_DENOMINATOR = 1000n;

function calculateMaxFee(
	currentBaseFee: bigint,
	blocksAhead: number,
	priorityFee: bigint,
): bigint {
	// Worst case: base fee increases maximally for N blocks
	let projectedBaseFee = currentBaseFee;
	for (let i = 0; i < blocksAhead; i++) {
		projectedBaseFee =
			(projectedBaseFee * BASE_FEE_MAX_CHANGE) / BASE_FEE_DENOMINATOR;
	}
	return projectedBaseFee + priorityFee;
}

// Current network state
const currentBaseFee = 50n; // Gwei
const priorityFee = 2n; // Gwei
for (let blocks = 1; blocks <= 5; blocks++) {
	const maxFeeValue = calculateMaxFee(currentBaseFee, blocks, priorityFee);
	const maxFee = MaxFeePerGas.fromGwei(maxFeeValue);
}
const normalBaseFee = 30n;
const normalPriority = 2n;
const normalMax = MaxFeePerGas.fromGwei(
	calculateMaxFee(normalBaseFee, 2, normalPriority),
);
const congestedBaseFee = 150n;
const urgentPriority = 5n;
const urgentMax = MaxFeePerGas.fromGwei(
	calculateMaxFee(congestedBaseFee, 1, urgentPriority),
);
const patientBaseFee = 40n;
const lowPriority = 1n;
const patientMax = MaxFeePerGas.fromGwei(
	calculateMaxFee(patientBaseFee, 10, lowPriority),
);
const manualBaseFee = 50n;
const manualPriority = 2n;
const manualBuffer = 15n; // 30% buffer
const manualMax = MaxFeePerGas.fromGwei(
	manualBaseFee + manualPriority + manualBuffer,
);
