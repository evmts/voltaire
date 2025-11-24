import * as Keccak256 from "../../../crypto/Keccak256/index.js";
import * as Address from "../../../primitives/Address/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example: Compute contract address using CREATE opcode
const deployer = Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");

// Contract address depends on deployer address and nonce
const nonce0 = Keccak256.contractAddress(deployer, 0n);
const nonce1 = Keccak256.contractAddress(deployer, 1n);
const nonce5 = Keccak256.contractAddress(deployer, 5n);

// Same deployer + nonce always produces same address (deterministic)
const nonce5Again = Keccak256.contractAddress(deployer, 5n);
