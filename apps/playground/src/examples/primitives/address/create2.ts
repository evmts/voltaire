import { Address, Bytecode, Hash } from "@tevm/voltaire";
// Example: CREATE2 opcode address generation
// CREATE2 allows deterministic contract addresses independent of nonce

const deployer = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const salt = Hash(`0x${"42".repeat(32)}`);
const initCode = Bytecode("0x608060405234801561001057600080fd5b50");

// Calculate CREATE2 address
const contractAddr = Address.calculateCreate2Address(deployer, salt, initCode);

// Same deployer, salt, and initCode always produce same address
const contractAddr2 = Address.calculateCreate2Address(deployer, salt, initCode);

// Different salt produces different address
const salt2 = Hash(`0x${"00".repeat(32)}`);
const contractAddr3 = Address.calculateCreate2Address(
	deployer,
	salt2,
	initCode,
);
