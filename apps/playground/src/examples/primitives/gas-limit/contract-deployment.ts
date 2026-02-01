import { Gas } from "@tevm/voltaire";
// Minimal contract (e.g., simple storage)
const simpleContract = Gas.gasLimitFrom(200000);
// Standard ERC20 deployment
const erc20Deployment = Gas.gasLimitFrom(1500000);
// NFT contract with metadata
const erc721Deployment = Gas.gasLimitFrom(2500000);
// DEX, lending protocol, etc.
const complexContract = Gas.gasLimitFrom(5000000);
const bytecodeSize = 10000; // bytes
const creationCost = 32000;
const bytecodeCost = bytecodeSize * 200;
const constructorEstimate = 500000; // constructor logic
const total = creationCost + bytecodeCost + constructorEstimate;
const withBuffer = Math.floor(total * 1.2); // 20% buffer

const deployLimit = Gas.gasLimitFrom(withBuffer);
