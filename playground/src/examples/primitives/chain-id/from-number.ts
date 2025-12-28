import { ChainId } from "voltaire";

// Standard creation
const mainnet = ChainId.from(1);

// Large chain IDs
const sepolia = ChainId.from(11155111);

// Custom/private chains
const customChain = ChainId.from(999999);
const optimism = ChainId.from(ChainId.OPTIMISM);

const base = ChainId.from(ChainId.BASE);

// Valid chain IDs
try {
	const valid1 = ChainId.from(0); // Valid: zero is allowed
} catch (error) {
	console.error("Error:", error.message);
}

try {
	const valid2 = ChainId.from(2147483647); // Valid: max safe integer
} catch (error) {
	console.error("Error:", error.message);
}

try {
	ChainId.from(-1); // Invalid: negative
} catch (error) {}

try {
	ChainId.from(1.5); // Invalid: not an integer
} catch (error) {}

try {
	ChainId.from(Number.NaN); // Invalid: NaN
} catch (error) {}

try {
	ChainId.from(Number.POSITIVE_INFINITY); // Invalid: infinity
} catch (error) {}

// Configuration-based chain selection
const config = { chainId: 137 };
const chain = ChainId.from(config.chainId);

// Array of chain IDs
const chainIds = [1, 10, 42161, 8453, 137];
const chains = chainIds.map((id) => ChainId.from(id));
