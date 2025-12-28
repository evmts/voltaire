import { Gas } from "voltaire";
// Simple swap (2 token transfers + AMM logic)
const uniswapSwap = Gas.gasLimitFrom(150000);

// Multi-hop swap (more hops = more gas)
const multiHopSwap = Gas.gasLimitFrom(300000);
// Deposit collateral
const aaveDeposit = Gas.gasLimitFrom(250000);

// Borrow
const aaveBorrow = Gas.gasLimitFrom(400000);

// Repay with interest calculation
const aaveRepay = Gas.gasLimitFrom(350000);
// Mint NFT
const nftMint = Gas.gasLimitFrom(200000);

// NFT marketplace listing
const nftList = Gas.gasLimitFrom(100000);

// NFT purchase (transfer + payment)
const nftPurchase = Gas.gasLimitFrom(250000);
// Executing multiple operations in one transaction
const operations = 5;
const gasPerOp = 50000;
const multicallBase = 50000;
const totalMulticall = multicallBase + operations * gasPerOp;

const multicall = Gas.gasLimitFrom(totalMulticall);
// Gnosis Safe or similar
const walletExecution = Gas.gasLimitFrom(500000);

// With signature verification
const multiSigExecution = Gas.gasLimitFrom(800000);

const estimated = 250000;
const buffer = Math.floor(estimated * 1.25); // 25% buffer
