import * as Address from "../../../primitives/Address/index.js";

// Example: CREATE opcode address generation
// When a contract deploys another contract using CREATE,
// the new contract's address is deterministically calculated

const deployer = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const nonce = 0n;

// Calculate address of first contract deployed
const firstContract = Address.calculateCreateAddress(deployer, nonce);
console.log("First deployment (nonce=0):", Address.toHex(firstContract));

// Second deployment
const secondContract = Address.calculateCreateAddress(deployer, 1n);
console.log("Second deployment (nonce=1):", Address.toHex(secondContract));

// Third deployment
const thirdContract = Address.calculateCreateAddress(deployer, 2n);
console.log("Third deployment (nonce=2):", Address.toHex(thirdContract));

// Nonce can be large
const highNonce = Address.calculateCreateAddress(deployer, 1000000n);
console.log("High nonce deployment:", Address.toHex(highNonce));
