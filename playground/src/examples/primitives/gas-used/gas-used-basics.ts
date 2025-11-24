import * as GasUsed from "../../../primitives/GasUsed/index.js";
const simpleTransfer = GasUsed.from(21000n); // Minimum ETH transfer
const erc20Transfer = GasUsed.from(65000n); // ERC-20 transfer
const complexContract = GasUsed.from(150000n); // Complex contract call
const fromString = GasUsed.from("51234");
const fromNumber = GasUsed.from(100000);
const gasPrice = 20_000_000_000n; // 20 gwei
const gasPriceHigh = 100_000_000_000n; // 100 gwei
