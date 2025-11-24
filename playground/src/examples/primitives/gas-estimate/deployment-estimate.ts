import * as GasEstimate from "../../../primitives/GasEstimate/index.js";

// Example: Contract deployment gas estimation

// Typical deployment costs (highly variable based on contract size)
const deployments = {
	tinyContract: GasEstimate.from(100000n), // Minimal contract
	simpleToken: GasEstimate.from(500000n), // Basic ERC20
	complexToken: GasEstimate.from(1500000n), // ERC20 with features
	nftContract: GasEstimate.from(2000000n), // ERC721
	dexContract: GasEstimate.from(3000000n), // Uniswap-style DEX
	governance: GasEstimate.from(2500000n), // DAO governance
};
for (const [type, estimate] of Object.entries(deployments)) {
}
const bytecodeSize = 5000; // bytes
const baseCost = 21000n;
const createCost = 32000n;
const codeCost = BigInt(bytecodeSize) * 200n; // 200 gas per byte

const totalEstimate = GasEstimate.from(baseCost + createCost + codeCost);

// Add buffer for constructor logic
const withConstructorLogic = GasEstimate.from(1200000n); // includes constructor
const deployment = GasEstimate.from(1000000n);
const buffer30 = GasEstimate.withBuffer(deployment, 30);
const buffer40 = GasEstimate.withBuffer(deployment, 40);
const buffer50 = GasEstimate.withBuffer(deployment, 50);
const erc20Estimate = GasEstimate.from(1200000n);

const withBuffer = GasEstimate.withBuffer(erc20Estimate, 40);

const gasLimit = GasEstimate.toGasLimit(withBuffer);

// Cost calculation
const gasPrice = 50_000_000_000n; // 50 gwei
const cost = gasLimit * gasPrice;
const ethCost = Number(cost) / 1e18;
const ethTransfer = GasEstimate.from(21000n);
const erc20Transfer = GasEstimate.from(65000n);
const deploymentCost = GasEstimate.from(1200000n);

const ratio =
	Number(GasEstimate.toBigInt(deploymentCost)) /
	Number(GasEstimate.toBigInt(ethTransfer));
