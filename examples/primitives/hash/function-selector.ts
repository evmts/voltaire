/**
 * Function Selector Example
 *
 * Demonstrates:
 * - Computing 4-byte function selectors
 * - Building calldata with selectors
 * - Decoding function calls
 * - Common Ethereum function selectors
 */

import { Hash } from "../../../src/primitives/Hash/index.js";

// Function selector = first 4 bytes of keccak256(signature)
function getFunctionSelector(signature: string): Uint8Array {
	const hash = Hash.keccak256String(signature);
	return Uint8Array.prototype.slice.call(hash, 0, 4);
}

function selectorToHex(selector: Uint8Array): string {
	return `0x${Array.from(selector)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
}

// ERC-20 Functions
const transfer = getFunctionSelector("transfer(address,uint256)");
const approve = getFunctionSelector("approve(address,uint256)");
const transferFrom = getFunctionSelector(
	"transferFrom(address,address,uint256)",
);
const balanceOf = getFunctionSelector("balanceOf(address)");
const allowance = getFunctionSelector("allowance(address,address)");

// ERC-721 Functions
const safeTransferFrom = getFunctionSelector(
	"safeTransferFrom(address,address,uint256)",
);
const safeTransferFromData = getFunctionSelector(
	"safeTransferFrom(address,address,uint256,bytes)",
);
const ownerOf = getFunctionSelector("ownerOf(uint256)");
const getApproved = getFunctionSelector("getApproved(uint256)");
const setApprovalForAll = getFunctionSelector(
	"setApprovalForAll(address,bool)",
);
const isApprovedForAll = getFunctionSelector(
	"isApprovedForAll(address,address)",
);

// ERC-1155 Functions
const safeTransferFrom1155 = getFunctionSelector(
	"safeTransferFrom(address,address,uint256,uint256,bytes)",
);
const safeBatchTransferFrom = getFunctionSelector(
	"safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
);
const balanceOf1155 = getFunctionSelector("balanceOf(address,uint256)");
const balanceOfBatch = getFunctionSelector(
	"balanceOfBatch(address[],uint256[])",
);

function buildCalldata(selector: Uint8Array, params: string): string {
	// Calldata = selector + ABI-encoded parameters
	const selectorHex = selectorToHex(selector).slice(2); // Remove 0x
	const paramsHex = params.startsWith("0x") ? params.slice(2) : params;
	return `0x${selectorHex}${paramsHex}`;
}

// Example: transfer(address to, uint256 amount)
// to = 0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e
// amount = 1000000 (1 USDC with 6 decimals)

const toAddress =
	"000000000000000000000000742d35Cc6634C0532925a3b844Bc9e7595f51e3e";
const amount =
	"00000000000000000000000000000000000000000000000000000000000f4240";

const transferCalldata = buildCalldata(transfer, toAddress + amount);

function extractSelector(calldata: string): string {
	// Selector is first 4 bytes (8 hex chars after 0x)
	return calldata.slice(0, 10);
}

function identifyFunction(calldata: string): string {
	const selector = extractSelector(calldata);

	// Simple lookup (in production, use a proper registry)
	const knownSelectors: Record<string, string> = {
		"0xa9059cbb": "transfer(address,uint256)",
		"0x095ea7b3": "approve(address,uint256)",
		"0x23b872dd": "transferFrom(address,address,uint256)",
		"0x70a08231": "balanceOf(address)",
		"0x42842e0e": "safeTransferFrom(address,address,uint256)",
		"0xb88d4fde": "safeTransferFrom(address,address,uint256,bytes)",
	};

	return knownSelectors[selector] || "Unknown";
}

// Test with sample calldata
const sampleCalldata = [
	"0xa9059cbb000000000000000000000000742d35Cc6634C0532925a3b844Bc9e7595f51e3e00000000000000000000000000000000000000000000000000000000000f4240",
	"0x095ea7b3000000000000000000000000742d35Cc6634C0532925a3b844Bc9e7595f51e3effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
	"0x70a08231000000000000000000000000742d35Cc6634C0532925a3b844Bc9e7595f51e3e",
];
sampleCalldata.forEach((data, i) => {
	const func = identifyFunction(data);
	const selector = extractSelector(data);
});

interface FunctionInfo {
	selector: string;
	signature: string;
	name: string;
	params: string[];
}

class FunctionRegistry {
	private functions = new Map<string, FunctionInfo>();

	register(signature: string): void {
		const hash = Hash.keccak256String(signature);
		const selector = selectorToHex(hash.slice(0, 4));

		// Parse signature
		const match = signature.match(/^([^(]+)\(([^)]*)\)$/);
		if (!match) throw new Error("Invalid signature");

		const name = match[1];
		const params = match[2] ? match[2].split(",") : [];

		this.functions.set(selector, {
			selector,
			signature,
			name,
			params,
		});
	}

	lookup(selector: string): FunctionInfo | undefined {
		return this.functions.get(selector);
	}

	all(): FunctionInfo[] {
		return Array.from(this.functions.values());
	}
}

// Build registry
const registry = new FunctionRegistry();

// Register ERC-20 functions
registry.register("transfer(address,uint256)");
registry.register("approve(address,uint256)");
registry.register("transferFrom(address,address,uint256)");
registry.register("balanceOf(address)");
registry.register("allowance(address,address)");
registry.register("totalSupply()");
registry.register("name()");
registry.register("symbol()");
registry.register("decimals()");
registry.all().forEach((func) => {});

// Lookup by selector
const lookedUp = registry.lookup("0xa9059cbb");
if (lookedUp) {
}

// Different function signatures can theoretically produce same selector
// (though extremely rare with 4 bytes = 2^32 possibilities)

function checkCollision(signatures: string[]): void {
	const selectors = new Map<string, string[]>();

	for (const sig of signatures) {
		const hash = Hash.keccak256String(sig);
		const selector = selectorToHex(hash.slice(0, 4));

		if (!selectors.has(selector)) {
			selectors.set(selector, []);
		}
		selectors.get(selector)?.push(sig);
	}

	// Find collisions
	const collisions = Array.from(selectors.entries()).filter(
		([_, sigs]) => sigs.length > 1,
	);

	if (collisions.length === 0) {
	} else {
		collisions.forEach(([selector, sigs]) => {
			sigs.forEach((sig) => {});
		});
	}
}

const testSignatures = [
	"transfer(address,uint256)",
	"approve(address,uint256)",
	"transferFrom(address,address,uint256)",
	"balanceOf(address)",
	"mint(address,uint256)",
	"burn(uint256)",
];

checkCollision(testSignatures);

function normalizeSignature(signature: string): string {
	// Remove all whitespace
	return signature.replace(/\s+/g, "");
}

// These should produce the same selector
const sig1 = "transfer(address,uint256)";
const sig2 = "transfer( address , uint256 )";
const sig3 = "transfer(address, uint256)";

const norm1 = normalizeSignature(sig1);
const norm2 = normalizeSignature(sig2);
const norm3 = normalizeSignature(sig3);

const sel1 = selectorToHex(getFunctionSelector(norm1));
const sel2 = selectorToHex(getFunctionSelector(norm2));
const sel3 = selectorToHex(getFunctionSelector(norm3));

interface KnownSelector {
	signature: string;
	selector: string;
}

const knownSelectors: KnownSelector[] = [
	{ signature: "transfer(address,uint256)", selector: "0xa9059cbb" },
	{ signature: "approve(address,uint256)", selector: "0x095ea7b3" },
	{ signature: "balanceOf(address)", selector: "0x70a08231" },
];
knownSelectors.forEach(({ signature, selector }) => {
	const computed = selectorToHex(getFunctionSelector(signature));
	const matches = computed === selector;
	if (!matches) {
	}
});
