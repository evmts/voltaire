import * as Opcode from "../../../primitives/Opcode/index.js";

// Example: Storage opcodes - SLOAD, SSTORE, TLOAD, TSTORE

console.log("=== Persistent Storage Opcodes ===");

// SLOAD (0x54) - Load from storage
const sloadInfo = Opcode.info(Opcode.SLOAD);
console.log("\nSLOAD (0x54):", {
	name: sloadInfo?.name,
	hex: "0x54",
	gasCost: `${sloadInfo?.gasCost} (base - actual cost varies)`,
	stackInputs: sloadInfo?.stackInputs, // key
	stackOutputs: sloadInfo?.stackOutputs, // value
	category: Opcode.getCategory(Opcode.SLOAD),
	description: "Load word from storage",
});

// SSTORE (0x55) - Store to storage
const sstoreInfo = Opcode.info(Opcode.SSTORE);
console.log("\nSSTORE (0x55):", {
	name: sstoreInfo?.name,
	hex: "0x55",
	gasCost: `${sstoreInfo?.gasCost} (minimum - depends on storage state)`,
	stackInputs: sstoreInfo?.stackInputs, // key, value
	stackOutputs: sstoreInfo?.stackOutputs, // none
	category: Opcode.getCategory(Opcode.SSTORE),
	description: "Save word to storage",
});

console.log("\n=== Transient Storage Opcodes (EIP-1153) ===");

// TLOAD (0x5c) - Load from transient storage
const tloadInfo = Opcode.info(Opcode.TLOAD);
console.log("\nTLOAD (0x5c):", {
	name: tloadInfo?.name,
	hex: "0x5c",
	gasCost: tloadInfo?.gasCost,
	stackInputs: tloadInfo?.stackInputs, // key
	stackOutputs: tloadInfo?.stackOutputs, // value
	category: Opcode.getCategory(Opcode.TLOAD),
	description: "Load word from transient storage (cleared after tx)",
});

// TSTORE (0x5d) - Store to transient storage
const tstoreInfo = Opcode.info(Opcode.TSTORE);
console.log("\nTSTORE (0x5d):", {
	name: tstoreInfo?.name,
	hex: "0x5d",
	gasCost: tstoreInfo?.gasCost,
	stackInputs: tstoreInfo?.stackInputs, // key, value
	stackOutputs: tstoreInfo?.stackOutputs, // none
	category: Opcode.getCategory(Opcode.TSTORE),
	description: "Save word to transient storage (cleared after tx)",
});

console.log("\n=== Storage Gas Costs ===");
console.log(`
Permanent Storage (SLOAD/SSTORE):
- SLOAD: Warm ${sloadInfo?.gasCost} gas, Cold 2100 gas
- SSTORE:
  - Set (zero -> non-zero): 20,000 gas
  - Update (non-zero -> non-zero): 5,000 gas (2,900 if warm)
  - Delete (non-zero -> zero): 5,000 gas + 15,000 gas refund
  - No-op (same value): 2,900 gas (warm) or 2,100 gas (cold)

Transient Storage (TLOAD/TSTORE):
- TLOAD: ${tloadInfo?.gasCost} gas (always warm)
- TSTORE: ${tstoreInfo?.gasCost} gas (always warm)
- Cheaper than permanent storage
- Cleared at end of transaction
- Good for reentrancy locks, temporary state
`);

console.log("=== Storage Categories ===");
console.log(`SLOAD: ${Opcode.getCategory(Opcode.SLOAD)}`);
console.log(`SSTORE: ${Opcode.getCategory(Opcode.SSTORE)}`);
console.log(`TLOAD: ${Opcode.getCategory(Opcode.TLOAD)}`);
console.log(`TSTORE: ${Opcode.getCategory(Opcode.TSTORE)}`);
