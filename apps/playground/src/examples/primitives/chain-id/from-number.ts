import { ChainId } from "@tevm/voltaire";

// Standard creation
const mainnet = ChainId(1);

// Large chain IDs
const sepolia = ChainId(11155111);

// Custom/private chains
const customChain = ChainId(999999);
const optimism = ChainId(ChainId.OPTIMISM);

const base = ChainId(ChainId.BASE);

// Valid chain IDs
try {
	const valid1 = ChainId(0); // Valid: zero is allowed
} catch (error) {
	console.error("Error:", error.message);
}

try {
	const valid2 = ChainId(2147483647); // Valid: max safe integer
} catch (error) {
	console.error("Error:", error.message);
}

try {
	ChainId(-1); // Invalid: negative
} catch (error) {}

try {
	ChainId(1.5); // Invalid: not an integer
} catch (error) {}

try {
	ChainId(Number.NaN); // Invalid: NaN
} catch (error) {}

try {
	ChainId(Number.POSITIVE_INFINITY); // Invalid: infinity
} catch (error) {}

// Configuration-based chain selection
const config = { chainId: 137 };
const chain = ChainId(config.chainId);

// Array of chain IDs
const chainIds = [1, 10, 42161, 8453, 137];
const chains = chainIds.map((id) => ChainId(id));
