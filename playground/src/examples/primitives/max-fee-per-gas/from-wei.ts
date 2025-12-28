import { MaxFeePerGas } from "voltaire";

// Create from Wei (most precise unit)
const fee1 = MaxFeePerGas.fromWei(50000000000n); // 50 Gwei in Wei
const fee2 = MaxFeePerGas.fromWei(100000000000n); // 100 Gwei in Wei
const fee3 = MaxFeePerGas.fromWei(1000000000n); // 1 Gwei in Wei

// 1.5 Gwei = 1,500,000,000 Wei
const onePointFiveGwei = MaxFeePerGas.fromWei(1500000000n);

// 0.1 Gwei = 100,000,000 Wei
const pointOneGwei = MaxFeePerGas.fromWei(100000000n);
const baseFeeWei = 45500000000n; // 45.5 Gwei
const priorityFeeWei = 1500000000n; // 1.5 Gwei
const calculatedMaxFee = MaxFeePerGas.fromWei(baseFeeWei + priorityFeeWei);
const l2Fee1 = MaxFeePerGas.fromWei(100000n); // 0.0001 Gwei
const l2Fee2 = MaxFeePerGas.fromWei(1000000n); // 0.001 Gwei
const l2Fee3 = MaxFeePerGas.fromWei(10000000n); // 0.01 Gwei
