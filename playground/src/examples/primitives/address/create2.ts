import * as Address from "../../../primitives/Address/index.js";
import * as Hash from "../../../primitives/Hash/index.js";
import * as Bytecode from "../../../primitives/Bytecode/index.js";

// Example: CREATE2 opcode address generation
// CREATE2 allows deterministic contract addresses independent of nonce

const deployer = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const salt = Hash.from("0x" + "42".repeat(32));
const initCode = Bytecode.from("0x608060405234801561001057600080fd5b50");

// Calculate CREATE2 address
const contractAddr = Address.calculateCreate2Address(deployer, salt, initCode);
console.log("CREATE2 address:", contractAddr.toHex());

// Same deployer, salt, and initCode always produce same address
const contractAddr2 = Address.calculateCreate2Address(deployer, salt, initCode);
console.log("Deterministic:", contractAddr.equals(contractAddr2));

// Different salt produces different address
const salt2 = Hash.from("0x" + "00".repeat(32));
const contractAddr3 = Address.calculateCreate2Address(
	deployer,
	salt2,
	initCode,
);
console.log("Different salt:", contractAddr3.toHex());
console.log("Different address:", !contractAddr.equals(contractAddr3));
