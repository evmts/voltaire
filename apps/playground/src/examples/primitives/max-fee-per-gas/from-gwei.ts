import { MaxFeePerGas } from "@tevm/voltaire";

// Common gas price levels in Gwei
const slow = MaxFeePerGas.fromGwei(30n);
const standard = MaxFeePerGas.fromGwei(50n);
const fast = MaxFeePerGas.fromGwei(100n);
const instant = MaxFeePerGas.fromGwei(200n);

// Normal network activity
const normalActivity = MaxFeePerGas.fromGwei(25n);

// High congestion (NFT mint, token launch)
const highCongestion = MaxFeePerGas.fromGwei(500n);

// Extreme congestion (major event)
const extremeCongestion = MaxFeePerGas.fromGwei(1000n);
const gasLimit = 21000n; // Standard ETH transfer
const maxFee = MaxFeePerGas.fromGwei(100n);
const maxCostWei = MaxFeePerGas.toWei(maxFee) * gasLimit;
const maxCostGwei = maxCostWei / 1000000000n;
