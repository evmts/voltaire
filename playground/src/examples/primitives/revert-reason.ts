import { Hex } from "@tevm/voltaire";

// RevertReason: Parse and decode EVM revert messages
// Used for error handling and debugging failed transactions

// Standard revert with message: Error(string)
const revertWithMessage = Hex.fromString(
	"0x08c379a0" + // Error(string) selector
	"0000000000000000000000000000000000000000000000000000000000000020" + // offset
	"0000000000000000000000000000000000000000000000000000000000000013" + // length (19)
	"496e73756666696369656e742062616c616e636500000000000000000000000000" // "Insufficient balance"
);
console.log("Revert with message:", Hex.toString(revertWithMessage).slice(0, 40) + "...");

// Custom error: InsufficientBalance(uint256 required, uint256 available)
const customError = Hex.fromString(
	"0xcf479181" + // InsufficientBalance(uint256,uint256) selector
	"0000000000000000000000000000000000000000000000000de0b6b3a7640000" + // 1 ETH required
	"0000000000000000000000000000000000000000000000000000000000000000"   // 0 available
);
console.log("Custom error:", Hex.toString(customError).slice(0, 40) + "...");

// Panic codes (Solidity built-in errors)
const panicCodes = {
	0x00: "Generic compiler panic",
	0x01: "Assert failed",
	0x11: "Arithmetic overflow/underflow",
	0x12: "Division by zero",
	0x21: "Invalid enum value",
	0x22: "Storage byte array encoding error",
	0x31: "pop() on empty array",
	0x32: "Array index out of bounds",
	0x41: "Too much memory allocated",
	0x51: "Zero function pointer call",
};

console.log("\nPanic codes:");
Object.entries(panicCodes).forEach(([code, reason]) => {
	console.log(`  0x${Number(code).toString(16).padStart(2, "0")}: ${reason}`);
});

// Example panic: arithmetic overflow (0x11)
const panicOverflow = Hex.fromString(
	"0x4e487b71" + // Panic(uint256) selector
	"0000000000000000000000000000000000000000000000000000000000000011"   // code 0x11
);
console.log("\nPanic overflow:", Hex.toString(panicOverflow).slice(0, 40) + "...");

// Common ERC20/ERC721 errors
const commonErrors = {
	"0xe602df05": "ERC20InsufficientBalance(address,uint256,uint256)",
	"0xfb8f41b2": "ERC20InsufficientAllowance(address,uint256,uint256)",
	"0x73c6ac6e": "ERC721InvalidReceiver(address)",
	"0x64283d7b": "ERC721InsufficientApproval(address,uint256)",
};

console.log("\nCommon ERC error selectors:");
Object.entries(commonErrors).forEach(([selector, sig]) => {
	console.log(`  ${selector}: ${sig}`);
});

// Decode revert reason from transaction receipt
function parseRevertReason(data: string): string {
	if (data.startsWith("0x08c379a0")) {
		// Standard Error(string)
		const hex = data.slice(10); // Remove selector
		const offset = parseInt(hex.slice(0, 64), 16);
		const length = parseInt(hex.slice(64, 128), 16);
		const messageHex = hex.slice(128, 128 + length * 2);
		return Buffer.from(messageHex, "hex").toString("utf8");
	}
	if (data.startsWith("0x4e487b71")) {
		// Panic(uint256)
		const code = parseInt(data.slice(10), 16);
		return panicCodes[code as keyof typeof panicCodes] || `Unknown panic 0x${code.toString(16)}`;
	}
	return "Unknown revert reason";
}

console.log("\nParsed message:", parseRevertReason("0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000b48656c6c6f576f726c64000000000000000000000000000000000000000000"));
