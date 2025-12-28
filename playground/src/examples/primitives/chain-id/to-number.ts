import { ChainId } from "@tevm/voltaire";

const mainnet = ChainId(1);
const mainnetNum = ChainId.toNumber(mainnet);

const sepolia = ChainId(11155111);
const sepoliaNum = ChainId.toNumber(sepolia);

// For API calls
const arbitrum = ChainId(ChainId.ARBITRUM);
const apiPayload = {
	method: "eth_chainId",
	chainId: ChainId.toNumber(arbitrum),
};

// For logging
const optimism = ChainId(ChainId.OPTIMISM);

// For comparisons with external values
const base = ChainId(ChainId.BASE);
const expectedChainId = 8453;
if (ChainId.toNumber(base) === expectedChainId) {
}

const chains = [
	ChainId(ChainId.MAINNET),
	ChainId(ChainId.OPTIMISM),
	ChainId(ChainId.ARBITRUM),
	ChainId(ChainId.BASE),
	ChainId(ChainId.POLYGON),
];
chains.forEach((chain) => {});

// Sum chain IDs (contrived example, but shows conversion)
const sum = chains.reduce((acc, chain) => acc + ChainId.toNumber(chain), 0);

// Convert to hex for RPC calls
const polygon = ChainId(ChainId.POLYGON);
const polygonNum = ChainId.toNumber(polygon);
const polygonHex = `0x${polygonNum.toString(16)}`;

// Common pattern for eth_chainId RPC response
const formatChainIdForRpc = (chainId: number) => {
	const id = ChainId(chainId);
	return `0x${ChainId.toNumber(id).toString(16)}`;
};
