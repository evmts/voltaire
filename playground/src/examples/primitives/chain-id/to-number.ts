import { ChainId } from "voltaire";

const mainnet = ChainId.from(1);
const mainnetNum = ChainId.toNumber(mainnet);

const sepolia = ChainId.from(11155111);
const sepoliaNum = ChainId.toNumber(sepolia);

// For API calls
const arbitrum = ChainId.from(ChainId.ARBITRUM);
const apiPayload = {
	method: "eth_chainId",
	chainId: ChainId.toNumber(arbitrum),
};

// For logging
const optimism = ChainId.from(ChainId.OPTIMISM);

// For comparisons with external values
const base = ChainId.from(ChainId.BASE);
const expectedChainId = 8453;
if (ChainId.toNumber(base) === expectedChainId) {
}

const chains = [
	ChainId.from(ChainId.MAINNET),
	ChainId.from(ChainId.OPTIMISM),
	ChainId.from(ChainId.ARBITRUM),
	ChainId.from(ChainId.BASE),
	ChainId.from(ChainId.POLYGON),
];
chains.forEach((chain) => {});

// Sum chain IDs (contrived example, but shows conversion)
const sum = chains.reduce((acc, chain) => acc + ChainId.toNumber(chain), 0);

// Convert to hex for RPC calls
const polygon = ChainId.from(ChainId.POLYGON);
const polygonNum = ChainId.toNumber(polygon);
const polygonHex = `0x${polygonNum.toString(16)}`;

// Common pattern for eth_chainId RPC response
const formatChainIdForRpc = (chainId: number) => {
	const id = ChainId.from(chainId);
	return `0x${ChainId.toNumber(id).toString(16)}`;
};
