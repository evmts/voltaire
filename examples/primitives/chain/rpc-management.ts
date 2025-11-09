/**
 * Chain Example 7: RPC Endpoint Management
 *
 * Demonstrates:
 * - Managing multiple RPC endpoints
 * - RPC fallback strategies
 * - Connection health checking
 * - Load balancing across endpoints
 */

import { Chain } from "../../../src/primitives/Chain/Chain.js";
import type { Chain as ChainType } from "../../../src/primitives/Chain/ChainType.js";

function getPrimaryRpc(chainId: number): string | null {
	const chain = Chain.fromId(chainId);
	if (!chain || chain.rpc.length === 0) {
		return null;
	}
	return chain.rpc[0];
}

function getAllRpcEndpoints(chainId: number): string[] {
	const chain = Chain.fromId(chainId);
	return chain?.rpc ?? [];
}

const quaiRpc = getPrimaryRpc(9);

const allQuaiRpcs = getAllRpcEndpoints(9);

interface RpcResult<T> {
	success: boolean;
	data?: T;
	error?: string;
	rpcUrl: string;
	attemptNumber: number;
}

// Simulated RPC call
async function mockRpcCall<T>(url: string, shouldFail = false): Promise<T> {
	// Simulate network delay
	await new Promise((resolve) => setTimeout(resolve, 100));

	if (shouldFail) {
		throw new Error(`Connection failed to ${url}`);
	}

	return { blockNumber: 12345678 } as T;
}

async function rpcCallWithFallback<T>(
	chainId: number,
	rpcCall: (url: string) => Promise<T>,
): Promise<RpcResult<T>> {
	const endpoints = getAllRpcEndpoints(chainId);

	if (endpoints.length === 0) {
		return {
			success: false,
			error: "No RPC endpoints available",
			rpcUrl: "",
			attemptNumber: 0,
		};
	}

	for (let i = 0; i < endpoints.length; i++) {
		const url = endpoints[i];

		try {
			const data = await rpcCall(url);
			return {
				success: true,
				data,
				rpcUrl: url,
				attemptNumber: i + 1,
			};
		} catch (error) {
			if (i === endpoints.length - 1) {
				return {
					success: false,
					error: "All RPC endpoints failed",
					rpcUrl: url,
					attemptNumber: i + 1,
				};
			}
		}
	}

	return {
		success: false,
		error: "Unexpected fallback completion",
		rpcUrl: "",
		attemptNumber: 0,
	};
}

// Simulate successful call
const result = await rpcCallWithFallback(9, (url) => mockRpcCall(url, false));

interface RpcHealth {
	url: string;
	healthy: boolean;
	lastChecked: Date;
	latency?: number;
	errorCount: number;
}

class RpcHealthTracker {
	private health: Map<string, RpcHealth> = new Map();

	async checkEndpoint(url: string): Promise<boolean> {
		const start = Date.now();

		try {
			await mockRpcCall(url, Math.random() > 0.7); // 30% failure rate
			const latency = Date.now() - start;

			this.health.set(url, {
				url,
				healthy: true,
				lastChecked: new Date(),
				latency,
				errorCount: 0,
			});

			return true;
		} catch {
			const existing = this.health.get(url);
			this.health.set(url, {
				url,
				healthy: false,
				lastChecked: new Date(),
				errorCount: (existing?.errorCount ?? 0) + 1,
			});

			return false;
		}
	}

	async checkChain(chainId: number): Promise<void> {
		const endpoints = getAllRpcEndpoints(chainId);

		for (const url of endpoints.slice(0, 3)) {
			// Limit to first 3
			const healthy = await this.checkEndpoint(url);
			const status = this.health.get(url);
			if (status?.latency) {
			}
			if (status?.errorCount) {
			}
		}
	}

	getHealthyEndpoints(chainId: number): string[] {
		const endpoints = getAllRpcEndpoints(chainId);
		return endpoints.filter((url) => this.health.get(url)?.healthy ?? true);
	}
}

const tracker = new RpcHealthTracker();
await tracker.checkChain(9);

class RpcLoadBalancer {
	private currentIndex: Map<number, number> = new Map();

	getNextEndpoint(chainId: number): string | null {
		const endpoints = getAllRpcEndpoints(chainId);
		if (endpoints.length === 0) return null;

		const current = this.currentIndex.get(chainId) ?? 0;
		const next = (current + 1) % endpoints.length;

		this.currentIndex.set(chainId, next);
		return endpoints[next];
	}

	// Round-robin selection
	async makeBalancedCall<T>(
		chainId: number,
		rpcCall: (url: string) => Promise<T>,
	): Promise<T> {
		const url = this.getNextEndpoint(chainId);
		if (!url) {
			throw new Error("No RPC endpoints available");
		}
		return rpcCall(url);
	}
}

const balancer = new RpcLoadBalancer();

// Make several balanced calls
for (let i = 0; i < 3; i++) {
	try {
		await balancer.makeBalancedCall(9, (url) => mockRpcCall(url));
	} catch (error) {}
}

interface ChainRpcConfig {
	chainId: number;
	customRpcs: string[];
	preferCustom: boolean;
}

function getRpcEndpoints(config: ChainRpcConfig): string[] {
	const chain = Chain.fromId(config.chainId);
	const defaultRpcs = chain?.rpc ?? [];

	if (config.preferCustom) {
		return [...config.customRpcs, ...defaultRpcs];
	}

	return [...defaultRpcs, ...config.customRpcs];
}

const customConfig: ChainRpcConfig = {
	chainId: 1,
	customRpcs: [
		"https://eth-mainnet.g.alchemy.com/v2/demo",
		"https://mainnet.infura.io/v3/demo",
	],
	preferCustom: true,
};

const configuredRpcs = getRpcEndpoints(customConfig);
configuredRpcs.slice(0, 4).forEach((url, i) => {
	const type = i < customConfig.customRpcs.length ? "(custom)" : "(default)";
});

function isValidRpcUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return parsed.protocol === "http:" || parsed.protocol === "https:";
	} catch {
		return false;
	}
}

function validateChainRpcs(chainId: number): {
	total: number;
	valid: number;
	invalid: string[];
} {
	const endpoints = getAllRpcEndpoints(chainId);
	const invalid: string[] = [];

	endpoints.forEach((url) => {
		if (!isValidRpcUrl(url)) {
			invalid.push(url);
		}
	});

	return {
		total: endpoints.length,
		valid: endpoints.length - invalid.length,
		invalid,
	};
}

const quaiValidation = validateChainRpcs(9);

class RpcConfigManager {
	private overrides: Map<number, string[]> = new Map();

	setOverride(chainId: number, rpcs: string[]): void {
		this.overrides.set(chainId, rpcs);
	}

	clearOverride(chainId: number): void {
		this.overrides.delete(chainId);
	}

	getRpcs(chainId: number): string[] {
		// Check for override first
		const override = this.overrides.get(chainId);
		if (override) {
			return override;
		}

		// Fall back to chain default
		return getAllRpcEndpoints(chainId);
	}

	hasOverride(chainId: number): boolean {
		return this.overrides.has(chainId);
	}
}

const manager = new RpcConfigManager();
const defaultRpcs = manager.getRpcs(1);

manager.setOverride(1, ["https://custom-rpc-1.example.com"]);
const overrideRpcs = manager.getRpcs(1);

manager.clearOverride(1);
const clearedRpcs = manager.getRpcs(1);
