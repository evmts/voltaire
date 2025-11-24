import * as Gas from "../../../primitives/Gas/index.js";

// Standard ETH transfer always costs exactly 21000 gas
const ethTransferGas = Gas.gasLimitFrom(21000);
const gasLimit = 21000n;

// At 20 gwei
const gasPriceGwei20 = 20_000_000_000n; // 20 gwei in wei
const cost20 = gasLimit * gasPriceGwei20;

// At 50 gwei
const gasPriceGwei50 = 50_000_000_000n;
const cost50 = gasLimit * gasPriceGwei50;

// At 100 gwei
const gasPriceGwei100 = 100_000_000_000n;
const cost100 = gasLimit * gasPriceGwei100;
