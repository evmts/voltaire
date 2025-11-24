import * as Opcode from "../../../primitives/Opcode/index.js";

// Example: Call opcodes - CALL, DELEGATECALL, STATICCALL, CALLCODE

console.log("=== External Call Opcodes ===");

// CALL (0xf1) - Message call
const callInfo = Opcode.info(Opcode.CALL);
console.log("\nCALL (0xf1):", {
	name: callInfo?.name,
	hex: "0xf1",
	gasCost: `${callInfo?.gasCost} (base - actual cost is dynamic)`,
	stackInputs: callInfo?.stackInputs, // gas, address, value, argsOffset, argsSize, retOffset, retSize
	stackOutputs: callInfo?.stackOutputs, // success (1 or 0)
	category: Opcode.getCategory(Opcode.CALL),
	description: "Message call to account with value transfer",
});

// DELEGATECALL (0xf4) - Message call preserving caller context
const delegatecallInfo = Opcode.info(Opcode.DELEGATECALL);
console.log("\nDELEGATECALL (0xf4):", {
	name: delegatecallInfo?.name,
	hex: "0xf4",
	gasCost: `${delegatecallInfo?.gasCost} (base - actual cost is dynamic)`,
	stackInputs: delegatecallInfo?.stackInputs, // gas, address, argsOffset, argsSize, retOffset, retSize
	stackOutputs: delegatecallInfo?.stackOutputs, // success (1 or 0)
	category: Opcode.getCategory(Opcode.DELEGATECALL),
	description: "Message call with same sender/value (for libraries)",
});

// STATICCALL (0xfa) - Static message call (no state changes)
const staticcallInfo = Opcode.info(Opcode.STATICCALL);
console.log("\nSTATICCALL (0xfa):", {
	name: staticcallInfo?.name,
	hex: "0xfa",
	gasCost: `${staticcallInfo?.gasCost} (base - actual cost is dynamic)`,
	stackInputs: staticcallInfo?.stackInputs, // gas, address, argsOffset, argsSize, retOffset, retSize
	stackOutputs: staticcallInfo?.stackOutputs, // success (1 or 0)
	category: Opcode.getCategory(Opcode.STATICCALL),
	description: "Static message call (no state modifications allowed)",
});

// CALLCODE (0xf2) - Message call with alternative account's code (deprecated)
const callcodeInfo = Opcode.info(Opcode.CALLCODE);
console.log("\nCALLCODE (0xf2) [DEPRECATED]:", {
	name: callcodeInfo?.name,
	hex: "0xf2",
	gasCost: `${callcodeInfo?.gasCost} (base - actual cost is dynamic)`,
	stackInputs: callcodeInfo?.stackInputs,
	stackOutputs: callcodeInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.CALLCODE),
	description: "Deprecated - use DELEGATECALL instead",
});

console.log("\n=== Call Comparison ===");
console.log(`
CALL vs DELEGATECALL vs STATICCALL:

CALL (0xf1):
- Caller: this contract
- Storage context: target contract
- Value: can send ETH
- Use: external contract calls with value transfer

DELEGATECALL (0xf4):
- Caller: original msg.sender (preserved)
- Storage context: this contract
- Value: no ETH transfer (uses current call value)
- Use: library calls, proxy patterns

STATICCALL (0xfa):
- Caller: this contract
- Storage context: target contract (read-only)
- Value: no ETH transfer
- State changes: FORBIDDEN (reverts if attempted)
- Use: view/pure function calls

CALLCODE (0xf2) [DEPRECATED]:
- Like DELEGATECALL but msg.sender is this contract
- Use DELEGATECALL instead
`);

console.log("=== Contract Creation Opcodes ===");

// CREATE (0xf0) - Create new contract
const createInfo = Opcode.info(Opcode.CREATE);
console.log("\nCREATE (0xf0):", {
	name: createInfo?.name,
	hex: "0xf0",
	gasCost: `${createInfo?.gasCost} (base)`,
	stackInputs: createInfo?.stackInputs, // value, offset, size
	stackOutputs: createInfo?.stackOutputs, // address (or 0 on failure)
	category: Opcode.getCategory(Opcode.CREATE),
	description: "Create new contract with init code",
});

// CREATE2 (0xf5) - Create new contract with deterministic address
const create2Info = Opcode.info(Opcode.CREATE2);
console.log("\nCREATE2 (0xf5):", {
	name: create2Info?.name,
	hex: "0xf5",
	gasCost: `${create2Info?.gasCost} (base)`,
	stackInputs: create2Info?.stackInputs, // value, offset, size, salt
	stackOutputs: create2Info?.stackOutputs, // address (or 0 on failure)
	category: Opcode.getCategory(Opcode.CREATE2),
	description: "Create contract with deterministic address (uses salt)",
});

console.log("\n=== Auth Opcodes (EIP-3074) ===");

// AUTH (0xf6) - Set authorized account
const authInfo = Opcode.info(Opcode.AUTH);
console.log("\nAUTH (0xf6):", {
	name: authInfo?.name,
	hex: "0xf6",
	gasCost: authInfo?.gasCost,
	stackInputs: authInfo?.stackInputs,
	stackOutputs: authInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.AUTH),
	description: "Authorize account for AUTHCALL (EIP-3074)",
});

// AUTHCALL (0xf7) - Call as authorized account
const authcallInfo = Opcode.info(Opcode.AUTHCALL);
console.log("\nAUTHCALL (0xf7):", {
	name: authcallInfo?.name,
	hex: "0xf7",
	gasCost: authcallInfo?.gasCost,
	stackInputs: authcallInfo?.stackInputs,
	stackOutputs: authcallInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.AUTHCALL),
	description: "Call as previously authorized account (EIP-3074)",
});
