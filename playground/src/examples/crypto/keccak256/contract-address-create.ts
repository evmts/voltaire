import * as Keccak256 from "../../../crypto/Keccak256/index.js";
import * as Address from "../../../primitives/Address/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example: Compute contract address using CREATE opcode
const deployer = Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");

// Contract address depends on deployer address and nonce
const nonce0 = Keccak256.contractAddress(deployer, 0n);
const nonce1 = Keccak256.contractAddress(deployer, 1n);
const nonce5 = Keccak256.contractAddress(deployer, 5n);

console.log("Deployer:", deployer.toHex());
console.log("\nContract addresses by nonce:");
console.log("Nonce 0:", Hex.fromBytes(nonce0));
console.log("Nonce 1:", Hex.fromBytes(nonce1));
console.log("Nonce 5:", Hex.fromBytes(nonce5));

// Different nonces produce different addresses
console.log("\nEach nonce creates unique address:");
console.log(
	"nonce0 ≠ nonce1:",
	Hex.fromBytes(nonce0) !== Hex.fromBytes(nonce1),
);
console.log(
	"nonce1 ≠ nonce5:",
	Hex.fromBytes(nonce1) !== Hex.fromBytes(nonce5),
);

// Same deployer + nonce always produces same address (deterministic)
const nonce5Again = Keccak256.contractAddress(deployer, 5n);
console.log(
	"\nDeterministic:",
	Hex.fromBytes(nonce5) === Hex.fromBytes(nonce5Again),
);
