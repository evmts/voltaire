import { Gas } from "@tevm/voltaire";
// Create from number
const limit1 = Gas.gasLimitFrom(21000);

// Create from bigint
const limit2 = Gas.gasLimitFrom(65000n);

// Create from hex string
const limit3 = Gas.gasLimitFrom("0x5208"); // 21000 in hex
const limit = Gas.gasLimitFrom(100000);
const ethTransfer = Gas.gasLimitFrom(21000);

const erc20Transfer = Gas.gasLimitFrom(65000);

const uniswapSwap = Gas.gasLimitFrom(150000);

const nftMint = Gas.gasLimitFrom(200000);
// Ethereum mainnet block gas limit (~30M)
const blockLimit = Gas.gasLimitFrom(30000000);

// Calculate percentage of block
const txGas = 150000;
const percentage = (txGas / 30000000) * 100;
