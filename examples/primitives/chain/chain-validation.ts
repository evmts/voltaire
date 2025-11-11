/**
 * Chain Example 6: Chain Validation
 *
 * Demonstrates:
 * - Validating chain IDs before operations
 * - Safe chain lookups with error handling
 * - Type-safe chain handling
 * - Production-ready validation patterns
 */

import { Chain } from "../../../src/primitives/Chain/Chain.js";
import type { Chain as ChainType } from "../../../src/primitives/Chain/ChainType.js";

function isValidChainId(chainId: number): boolean {
	return Chain.fromId(chainId) !== undefined;
}

function validateChainId(chainId: number): ChainType {
	const chain = Chain.fromId(chainId);
	if (!chain) {
		throw new Error(`Invalid chain ID: ${chainId}`);
	}
	return chain;
}

const testIds = [1, 9, 42161, 999999999];
testIds.forEach((id) => {
	const valid = isValidChainId(id);
});

function getChainSafely(chainId: number): ChainType | null {
	try {
		return validateChainId(chainId);
	} catch (error) {
		return null;
	}
}

const mainnet = getChainSafely(1);
if (mainnet) {
}

const invalid = getChainSafely(999999999);
if (!invalid) {
}

function isKnownChain(chainId: number): chainId is number {
	return Chain.fromId(chainId) !== undefined;
}

function processChainId(chainId: number): void {
	if (isKnownChain(chainId)) {
		const chain = Chain.fromId(chainId);
		if (!chain) {
			throw new Error("Chain guard failed");
		}
	} else {
	}
}

processChainId(1);
processChainId(999999);

function requireChain(chainId: number, context: string): ChainType {
	const chain = Chain.fromId(chainId);
	if (!chain) {
		throw new Error(`${context}: Chain ID ${chainId} is not supported`);
	}
	return chain;
}

try {
	const chain = requireChain(1, "Transaction processing");
} catch (error) {}

try {
	requireChain(999999, "Transaction processing");
} catch (error) {}

const ALLOWED_CHAINS = [1, 10, 42161, 8453] as const;
type AllowedChainId = (typeof ALLOWED_CHAINS)[number];

function validateAllowedChain(chainId: number): chainId is AllowedChainId {
	return ALLOWED_CHAINS.includes(chainId as AllowedChainId);
}

function requireAllowedChain(chainId: number): ChainType {
	if (!validateAllowedChain(chainId)) {
		const chain = Chain.fromId(chainId);
		const name = chain ? chain.name : `Chain ${chainId}`;
		throw new Error(`${name} is not in the allowlist`);
	}

	const chain = Chain.fromId(chainId);
	if (!chain) {
		throw new Error("Chain validation passed but chain not found");
	}
	return chain;
}

const testAllowed = [1, 9, 42161, 137];
testAllowed.forEach((id) => {
	try {
		const chain = requireAllowedChain(id);
	} catch (error) {}
});

function requireRpc(chain: ChainType): string {
	if (!chain.rpc || chain.rpc.length === 0) {
		throw new Error(`${chain.name} has no RPC endpoints configured`);
	}
	return chain.rpc[0];
}

function requireExplorer(chain: ChainType): string {
	const explorer = chain.explorers?.[0];
	if (!explorer) {
		throw new Error(`${chain.name} has no block explorer configured`);
	}
	return explorer.url;
}

function validateChainFeatures(chainId: number): boolean {
	const chain = Chain.fromId(chainId);
	if (!chain) {
		return false;
	}

	try {
		const rpc = requireRpc(chain);
	} catch (error) {
		return false;
	}

	try {
		const explorer = requireExplorer(chain);
	} catch (error) {}

	return true;
}

validateChainFeatures(9);
validateChainFeatures(14);

interface ChainRequirements {
	hasRpc: boolean;
	hasExplorer: boolean;
	minRpcEndpoints?: number;
	requiredSymbol?: string;
}

function validateChainRequirements(
	chainId: number,
	requirements: ChainRequirements,
): { valid: boolean; errors: string[] } {
	const chain = Chain.fromId(chainId);
	const errors: string[] = [];

	if (!chain) {
		errors.push(`Chain ID ${chainId} not found`);
		return { valid: false, errors };
	}

	if (requirements.hasRpc && chain.rpc.length === 0) {
		errors.push("No RPC endpoints available");
	}

	if (
		requirements.minRpcEndpoints &&
		chain.rpc.length < requirements.minRpcEndpoints
	) {
		errors.push(
			`Requires ${requirements.minRpcEndpoints} RPC endpoints, has ${chain.rpc.length}`,
		);
	}

	if (requirements.hasExplorer && !chain.explorers?.[0]) {
		errors.push("No block explorer available");
	}

	if (
		requirements.requiredSymbol &&
		chain.nativeCurrency.symbol !== requirements.requiredSymbol
	) {
		errors.push(
			`Requires ${requirements.requiredSymbol}, has ${chain.nativeCurrency.symbol}`,
		);
	}

	return { valid: errors.length === 0, errors };
}

const strictRequirements: ChainRequirements = {
	hasRpc: true,
	hasExplorer: true,
	minRpcEndpoints: 1,
	requiredSymbol: "ETH",
};

const checkChains = [1, 9, 10, 42161];
checkChains.forEach((id) => {
	const result = validateChainRequirements(id, strictRequirements);
	const chain = Chain.fromId(id);

	if (chain) {
		if (result.valid) {
		} else {
			result.errors.forEach((error) => {});
		}
	}
});

type Environment = "production" | "staging" | "development";

function getEnvironment(): Environment {
	// In real app, read from process.env
	return "production";
}

function isChainAllowedInEnvironment(
	chainId: number,
	env: Environment,
): boolean {
	const chain = Chain.fromId(chainId);
	if (!chain) return false;

	const name = chain.name.toLowerCase();
	const isTestnet =
		name.includes("testnet") ||
		name.includes("sepolia") ||
		name.includes("goerli");

	switch (env) {
		case "production":
			// Production: only mainnets
			return !isTestnet;
		case "staging":
			// Staging: testnets and some mainnets
			return true;
		case "development":
			// Development: all chains
			return true;
		default:
			return false;
	}
}

const env = getEnvironment();

const envTestChains = [1, 11155111, 10, 42161];
envTestChains.forEach((id) => {
	const chain = Chain.fromId(id);
	const allowed = isChainAllowedInEnvironment(id, env);

	if (chain) {
	}
});
