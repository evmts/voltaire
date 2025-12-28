import { MaxPriorityFeePerGas } from "@tevm/voltaire";

const tipWei = MaxPriorityFeePerGas(2000000000n); // 2 Gwei in Wei
const tipGwei = MaxPriorityFeePerGas.fromGwei(2n); // 2 Gwei
const tipHex = MaxPriorityFeePerGas("0x77359400"); // 2 Gwei as hex
const tip = MaxPriorityFeePerGas.fromGwei(2);
const low = MaxPriorityFeePerGas.fromGwei(1); // Low priority - 1 Gwei
const medium = MaxPriorityFeePerGas.fromGwei(2); // Medium - 2 Gwei
const high = MaxPriorityFeePerGas.fromGwei(5); // High priority - 5 Gwei
const urgent = MaxPriorityFeePerGas.fromGwei(10); // Urgent - 10 Gwei
const baseFee = 30n; // Base fee in Gwei (network-determined)
const priorityFee = MaxPriorityFeePerGas.fromGwei(2); // Your tip
const maxFeePerGas = baseFee + MaxPriorityFeePerGas.toGwei(priorityFee);
