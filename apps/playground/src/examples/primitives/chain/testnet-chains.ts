import { Chain } from "@tevm/voltaire";

// Example: Ethereum testnet chains (Sepolia, Holesky)

// biome-ignore lint/style/noNonNullAssertion: example code with known valid IDs
const sepoliaChain = Chain.fromId(11155111)!; // Sepolia
// biome-ignore lint/style/noNonNullAssertion: example code with known valid IDs
const holeskyChain = Chain.fromId(17000)!; // Holesky
