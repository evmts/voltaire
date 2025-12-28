import { MaxPriorityFeePerGas } from "voltaire";

const tip1 = MaxPriorityFeePerGas.fromGwei(1n);
const tip2 = MaxPriorityFeePerGas.fromGwei(2n);
const tip5 = MaxPriorityFeePerGas.fromGwei(5n);
const lowTip = MaxPriorityFeePerGas.fromGwei(1);
const medTip = MaxPriorityFeePerGas.fromGwei(2);
const highTip = MaxPriorityFeePerGas.fromGwei(5);
// For sub-Gwei precision, use Wei directly
const halfGwei = MaxPriorityFeePerGas.from(500000000n); // 0.5 Gwei
const quarterGwei = MaxPriorityFeePerGas.from(250000000n); // 0.25 Gwei
const slow = MaxPriorityFeePerGas.fromGwei(1); // Slow inclusion
const standard = MaxPriorityFeePerGas.fromGwei(2); // Standard priority
const fast = MaxPriorityFeePerGas.fromGwei(5); // Fast inclusion
const rapid = MaxPriorityFeePerGas.fromGwei(10); // Very fast
const urgent = MaxPriorityFeePerGas.fromGwei(50); // MEV protection
