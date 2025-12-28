import { MaxFeePerGas } from "@tevm/voltaire";

// Example: MaxFeePerGas basics - EIP-1559 transaction fees

// Create MaxFeePerGas from different units
const feeFromGwei = MaxFeePerGas.fromGwei(100n); // 100 Gwei
const feeFromWei = MaxFeePerGas.fromWei(100000000000n); // Same as above
const feeFromHex = MaxFeePerGas("0x174876e800"); // Same value
const conservative = MaxFeePerGas.fromGwei(50n); // Low priority
const normal = MaxFeePerGas.fromGwei(100n); // Standard
const aggressive = MaxFeePerGas.fromGwei(200n); // High priority
const urgent = MaxFeePerGas.fromGwei(500n); // Critical
const baseFee = 50n; // Gwei - current network base fee
const priorityFee = 2n; // Gwei - tip for validators
const buffer = 10n; // Gwei - safety buffer

const maxFee = MaxFeePerGas.fromGwei(baseFee + priorityFee + buffer);
const minRequired = MaxFeePerGas.fromGwei(baseFee + priorityFee);
const userMaxFee = MaxFeePerGas.fromGwei(100n);
const isValid = MaxFeePerGas.compare(userMaxFee, minRequired) >= 0;
