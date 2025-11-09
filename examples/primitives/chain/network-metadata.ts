/**
 * Chain Example 2: Network Metadata
 *
 * Demonstrates:
 * - Accessing chain properties (RPC, explorer, currency)
 * - Working with native currency details
 * - Generating explorer links
 * - Using RPC endpoints with fallbacks
 */

import { Chain } from "../../../src/primitives/Chain/Chain.js";

const quai = Chain.fromId(9);
if (quai) {
	quai.rpc.forEach((rpc, i) => {});
	if (quai.explorers && quai.explorers.length > 0) {
		quai.explorers.forEach((explorer) => {
			if (explorer.standard) {
			}
		});
	}
	if (quai.infoURL) {
	}
}

function getRpcWithFallback(chainId: number): string | null {
	const chain = Chain.fromId(chainId);
	if (!chain || chain.rpc.length === 0) {
		return null;
	}
	// Return first available RPC
	return chain.rpc[0];
}

function getAllRpcEndpoints(chainId: number): string[] {
	const chain = Chain.fromId(chainId);
	return chain?.rpc ?? [];
}

const flareRpc = getRpcWithFallback(14);

const allFlareRpcs = getAllRpcEndpoints(14);

type LinkType = "tx" | "address" | "block";

function generateExplorerLink(
	chainId: number,
	type: LinkType,
	value: string,
): string | null {
	const chain = Chain.fromId(chainId);
	const explorer = chain?.explorers?.[0];

	if (!explorer) {
		return null;
	}

	return `${explorer.url}/${type}/${value}`;
}

const txHash =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e";
const blockNumber = "12345678";

const quaiTxLink = generateExplorerLink(9, "tx", txHash);
const quaiAddressLink = generateExplorerLink(9, "address", address);
const quaiBlockLink = generateExplorerLink(9, "block", blockNumber);

function formatNativeAmount(chainId: number, weiAmount: bigint): string | null {
	const chain = Chain.fromId(chainId);
	if (!chain) return null;

	const decimals = chain.nativeCurrency.decimals;
	const symbol = chain.nativeCurrency.symbol;

	// Convert wei to token amount
	const divisor = 10n ** BigInt(decimals);
	const tokenAmount = Number(weiAmount) / Number(divisor);

	return `${tokenAmount.toFixed(6)} ${symbol}`;
}

const amount1 = 1500000000000000000n; // 1.5 in wei (18 decimals)
const amount2 = 5000000000000000000n; // 5 in wei

const quaiFormatted = formatNativeAmount(9, amount1);
const flareFormatted = formatNativeAmount(14, amount2);

interface ChainSummary {
	id: number;
	name: string;
	symbol: string;
	rpcCount: number;
	hasExplorer: boolean;
}

function summarizeChain(chainId: number): ChainSummary | null {
	const chain = Chain.fromId(chainId);
	if (!chain) return null;

	return {
		id: chain.chainId,
		name: chain.name,
		symbol: chain.nativeCurrency.symbol,
		rpcCount: chain.rpc.length,
		hasExplorer: !!chain.explorers?.[0],
	};
}

const chainIds = [9, 14, 1776, 2020, 2288];
const summaries = chainIds
	.map(summarizeChain)
	.filter((s): s is ChainSummary => s !== null);

summaries.forEach((summary) => {});
