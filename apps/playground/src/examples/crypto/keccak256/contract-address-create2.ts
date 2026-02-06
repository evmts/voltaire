import { Address, Bytes, Hex, Keccak256 } from "@tevm/voltaire";
// Example: Compute contract address using CREATE2 opcode
const deployer = Address("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");

// CREATE2 requires: deployer address, salt, and initCode hash
const salt = Bytes.zero(32); // 32-byte salt (all zeros)
const initCode = Hex.toBytes("0x60806040"); // Simple bytecode
const initCodeHash = Keccak256.hash(initCode);

const contractAddr = Keccak256.create2Address(deployer, salt, initCodeHash);

// Different salts produce different addresses
const salt1 = Bytes([...Array(31).fill(0), 1]);
const addr1 = Keccak256.create2Address(deployer, salt1, initCodeHash);

// Same parameters always produce same address (deterministic)
const addrAgain = Keccak256.create2Address(deployer, salt, initCodeHash);
