import { GasUsed } from "@tevm/voltaire";
const simpleTransfer = GasUsed(21000n); // Minimum ETH transfer
const erc20Transfer = GasUsed(65000n); // ERC-20 transfer
const complexContract = GasUsed(150000n); // Complex contract call
const fromString = GasUsed("51234");
const fromNumber = GasUsed(100000);
const gasPrice = 20_000_000_000n; // 20 gwei
const gasPriceHigh = 100_000_000_000n; // 100 gwei
