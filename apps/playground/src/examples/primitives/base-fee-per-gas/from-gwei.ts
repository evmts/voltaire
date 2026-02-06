import { BaseFeePerGas } from "@tevm/voltaire";

// Typical mainnet base fees
const veryLow = BaseFeePerGas.fromGwei(5n);
const low = BaseFeePerGas.fromGwei(15n);
const medium = BaseFeePerGas.fromGwei(25n);
const high = BaseFeePerGas.fromGwei(50n);
const veryHigh = BaseFeePerGas.fromGwei(100n);
const extreme = BaseFeePerGas.fromGwei(500n);
const fromNumber = BaseFeePerGas.fromGwei(25); // number
const postMerge = BaseFeePerGas.fromGwei(13n); // Typical post-merge
const nftDrop = BaseFeePerGas.fromGwei(300n); // Major NFT drop
const defiPanic = BaseFeePerGas.fromGwei(1000n); // DeFi panic event
const testnet = BaseFeePerGas.fromGwei(0n);
