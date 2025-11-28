// EVM Host: In-memory blockchain state
import { Host } from "../../../src/evm/Host/index.js";
import { Address } from "../../../src/primitives/Address/index.js";

// Create in-memory host for testing
const host = Host.createMemoryHost();

// Work with addresses
const alice = Address("0x1111111111111111111111111111111111111111");
const bob = Address("0x2222222222222222222222222222222222222222");

// Set and get balances
console.log("=== Account Balances ===");
host.setBalance(alice, 1000000000000000000n); // 1 ETH
host.setBalance(bob, 500000000000000000n); // 0.5 ETH

console.log("Alice balance:", host.getBalance(alice), "wei");
console.log("Bob balance:", host.getBalance(bob), "wei");
console.log("Unknown account:", host.getBalance(Address.zero()));

// Account nonces
console.log("\n=== Account Nonces ===");
host.setNonce(alice, 5n);
console.log("Alice nonce:", host.getNonce(alice));

// Deploy code
console.log("\n=== Contract Code ===");
const contractAddr = Address("0x3333333333333333333333333333333333333333");
const bytecode = new Uint8Array([0x60, 0x80, 0x60, 0x40, 0x52]); // PUSH1 0x80 PUSH1 0x40 MSTORE

host.setCode(contractAddr, bytecode);
const code = host.getCode(contractAddr);
console.log("Contract code length:", code.length, "bytes");
console.log("Empty account code:", host.getCode(alice).length);
