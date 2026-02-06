import { Gas } from "@tevm/voltaire";
// Ethereum mainnet block gas limit
const blockLimit = Gas.gasLimitFrom(30000000);

// How many transactions fit in a block?
const ethTransferGas = 21000;
const maxEthTransfers = Math.floor(30000000 / ethTransferGas);

const erc20TransferGas = 65000;
const maxErc20Transfers = Math.floor(30000000 / erc20TransferGas);

const uniswapSwapGas = 150000;
const maxSwaps = Math.floor(30000000 / uniswapSwapGas);

const nftMintGas = 200000;
const maxMints = Math.floor(30000000 / nftMintGas);
function blockPercentage(txGas: number): string {
	return ((txGas / 30000000) * 100).toFixed(4);
}

// Ethereum mainnet
const ethMainnet = Gas.gasLimitFrom(30000000);

// Optimism (L2)
const optimism = Gas.gasLimitFrom(30000000);

// Arbitrum (L2, higher limit)
const arbitrum = Gas.gasLimitFrom(1125899906842624n);

// Polygon
const polygon = Gas.gasLimitFrom(30000000);

// BSC (higher limit)
const bsc = Gas.gasLimitFrom(140000000);
