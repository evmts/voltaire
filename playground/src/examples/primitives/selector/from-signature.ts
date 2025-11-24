import * as Selector from "../../../primitives/Selector/index.js";

// Example: Computing selectors from function signatures

console.log("=== Function Selector Calculation ===\n");
console.log("Selector = first 4 bytes of keccak256(signature)\n");

console.log("--- Simple Functions ---\n");

const transfer = Selector.fromSignature("transfer(address,uint256)");
console.log(`Signature: transfer(address,uint256)`);
console.log(`Selector:  ${Selector.toHex(transfer)}`);
console.log(`Process:   keccak256("transfer(address,uint256)")[0:4]\n`);

const balanceOf = Selector.fromSignature("balanceOf(address)");
console.log(`Signature: balanceOf(address)`);
console.log(`Selector:  ${Selector.toHex(balanceOf)}`);
console.log(`Process:   keccak256("balanceOf(address)")[0:4]\n`);

console.log("--- Functions with No Parameters ---\n");

const totalSupply = Selector.fromSignature("totalSupply()");
console.log(`Signature: totalSupply()`);
console.log(`Selector:  ${Selector.toHex(totalSupply)}`);
console.log(`Note:      Empty parens required\n`);

const pause = Selector.fromSignature("pause()");
console.log(`Signature: pause()`);
console.log(`Selector:  ${Selector.toHex(pause)}\n`);

console.log("--- Complex Parameter Types ---\n");

const swapExactTokensForTokens = Selector.fromSignature(
	"swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
);
console.log(
	`Signature: swapExactTokensForTokens(uint256,uint256,address[],address,uint256)`,
);
console.log(`Selector:  ${Selector.toHex(swapExactTokensForTokens)}`);
console.log(`Note:      Array notation address[]\n`);

const multicall = Selector.fromSignature("multicall(bytes[])");
console.log(`Signature: multicall(bytes[])`);
console.log(`Selector:  ${Selector.toHex(multicall)}`);
console.log(`Note:      Dynamic array of bytes\n`);

const execute = Selector.fromSignature(
	"execute(address,uint256,bytes,uint8,bytes32,bytes32)",
);
console.log(`Signature: execute(address,uint256,bytes,uint8,bytes32,bytes32)`);
console.log(`Selector:  ${Selector.toHex(execute)}`);
console.log(`Note:      Mixed fixed and dynamic types\n`);

console.log("--- Canonical Type Names Required ---\n");

console.log("Correct type names:");
console.log("  uint256 (not uint)");
console.log("  int256 (not int)");
console.log("  bytes32 (specific size)");
console.log("  address (20 bytes)");
console.log("  bool");
console.log("  string, bytes (dynamic)\n");

const correctSel = Selector.fromSignature("approve(address,uint256)");
console.log(`approve(address,uint256): ${Selector.toHex(correctSel)}\n`);

console.log("--- No Spaces Allowed ---\n");

const noSpacesSel = Selector.fromSignature(
	"transferFrom(address,address,uint256)",
);
console.log(
	`Correct:   transferFrom(address,address,uint256) -> ${Selector.toHex(noSpacesSel)}`,
);
console.log(`Incorrect: transferFrom(address, address, uint256) // spaces`);
console.log(`Incorrect: transferFrom( address,address,uint256 ) // spaces\n`);

console.log("--- Overloaded Functions ---\n");

const safeTransferFrom3 = Selector.fromSignature(
	"safeTransferFrom(address,address,uint256)",
);
const safeTransferFrom4 = Selector.fromSignature(
	"safeTransferFrom(address,address,uint256,bytes)",
);

console.log(`safeTransferFrom(address,address,uint256):`);
console.log(`  ${Selector.toHex(safeTransferFrom3)}\n`);

console.log(`safeTransferFrom(address,address,uint256,bytes):`);
console.log(`  ${Selector.toHex(safeTransferFrom4)}\n`);

console.log(
	"Different parameter counts = different selectors:",
	!Selector.equals(safeTransferFrom3, safeTransferFrom4),
);

console.log("\n--- Struct and Tuple Parameters ---\n");

// Structs are represented as tuples
const fillOrder = Selector.fromSignature(
	"fillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)",
);
console.log(`Signature with tuple (struct):`);
console.log(`  fillOrder((address,address,...,bytes,bytes),uint256,bytes)`);
console.log(`  Selector: ${Selector.toHex(fillOrder)}\n`);

console.log("--- Event Signatures (not selectors) ---\n");
console.log("Events use full 32-byte hash, not 4-byte selector:");
console.log("  Transfer(address,address,uint256)");
console.log("  Hash: keccak256(signature) // all 32 bytes");
console.log("  Used in logs, not in calldata\n");
