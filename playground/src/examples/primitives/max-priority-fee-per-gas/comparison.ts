import * as MaxPriorityFeePerGas from "../../../primitives/MaxPriorityFeePerGas/index.js";

// Example: Comparing MaxPriorityFeePerGas values

// Create several priority fees
const tip1 = MaxPriorityFeePerGas.fromGwei(1);
const tip2 = MaxPriorityFeePerGas.fromGwei(2);
const tip2Copy = MaxPriorityFeePerGas.from(2000000000n);
const tip5 = MaxPriorityFeePerGas.fromGwei(5);
const tip10 = MaxPriorityFeePerGas.fromGwei(10);
const userTip = MaxPriorityFeePerGas.fromGwei(3);
const minTip = MaxPriorityFeePerGas.fromGwei(1);
const maxTip = MaxPriorityFeePerGas.fromGwei(100);

if (MaxPriorityFeePerGas.compare(userTip, minTip) < 0) {
} else if (MaxPriorityFeePerGas.compare(userTip, maxTip) > 0) {
} else {
}
const unsorted = [
	MaxPriorityFeePerGas.fromGwei(10),
	MaxPriorityFeePerGas.fromGwei(2),
	MaxPriorityFeePerGas.fromGwei(5),
	MaxPriorityFeePerGas.fromGwei(1),
	MaxPriorityFeePerGas.fromGwei(3),
];

const sorted = [...unsorted].sort((a, b) => MaxPriorityFeePerGas.compare(a, b));
const tips = [
	MaxPriorityFeePerGas.fromGwei(2),
	MaxPriorityFeePerGas.fromGwei(5),
	MaxPriorityFeePerGas.fromGwei(1),
	MaxPriorityFeePerGas.fromGwei(8),
];

const min = tips.reduce((a, b) =>
	MaxPriorityFeePerGas.compare(a, b) < 0 ? a : b,
);
const max = tips.reduce((a, b) =>
	MaxPriorityFeePerGas.compare(a, b) > 0 ? a : b,
);
