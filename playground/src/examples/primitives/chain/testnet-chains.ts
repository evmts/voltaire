import { Chain } from "@tevm/voltaire";

// Example: Ethereum testnet chains (Sepolia, Holesky)

const sepoliaChain = Chain.fromId(11155111)!; // Sepolia
const holeskyChain = Chain.fromId(17000)!; // Holesky
