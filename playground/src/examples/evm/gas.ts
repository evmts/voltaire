import { GasConstants, Bytecode, Opcode } from "@tevm/voltaire";

// Gas estimation and gas constants

// Basic gas constants
console.log("Transaction base cost:", GasConstants.Tx);
console.log("Contract creation base:", GasConstants.TxContractCreation);
console.log("Zero byte in calldata:", GasConstants.TxDataZero);
console.log("Non-zero byte in calldata:", GasConstants.TxDataNonZero);

// Storage operation costs
console.log("\nStorage operations:");
console.log("SLOAD (warm):", GasConstants.WarmStorageRead);
console.log("SLOAD (cold):", GasConstants.ColdSload);
console.log("SSTORE (set 0->non-0):", GasConstants.SstoreSet);
console.log("SSTORE (reset):", GasConstants.SstoreReset);

// Memory and hashing
console.log("\nMemory and hashing:");
console.log("Memory per word:", GasConstants.Memory);
console.log("Keccak256 base:", GasConstants.Keccak256Base);
console.log("Keccak256 per word:", GasConstants.Keccak256Word);

// Call costs
console.log("\nCall operations:");
console.log("CALL base:", GasConstants.Call);
console.log("CALL with value:", GasConstants.CallValueTransfer);
console.log("New account cost:", GasConstants.CallNewAccount);
console.log("Call stipend:", GasConstants.CallStipend);

// Calculate gas for simple bytecode
const code = Bytecode("0x6001600201"); // PUSH1 1, PUSH1 2, ADD
const instructions = Bytecode.parseInstructions(code);
let totalGas = 0n;
console.log("\nGas breakdown for PUSH1 1, PUSH1 2, ADD:");
for (const inst of instructions) {
  const gas = Opcode.getGasCost(inst.opcode);
  if (gas !== undefined) {
    totalGas += BigInt(gas);
    console.log(`  ${Opcode.getName(inst.opcode)}: ${gas} gas`);
  }
}
console.log(`  Total: ${totalGas} gas`);

// EIP-specific features
console.log("\nEIP feature checks:");
console.log("Has EIP-2929 (access lists):", GasConstants.hasEIP2929("shanghai"));
console.log("Has EIP-4844 (blobs):", GasConstants.hasEIP4844("cancun"));
console.log("Has EIP-1153 (transient storage):", GasConstants.hasEIP1153("cancun"));
