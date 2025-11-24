import * as Selector from "../../../primitives/Selector/index.js";

// Example: Selector basics - function selectors, 4-byte signatures

console.log("=== Creating Selectors ===\n");

// Create from function signature (most common)
const transferSel = Selector.fromSignature("transfer(address,uint256)");
console.log(
	"transfer(address,uint256):",
	Selector.toHex(transferSel),
	"// ERC20 transfer",
);

const approveSel = Selector.fromSignature("approve(address,uint256)");
console.log(
	"approve(address,uint256):  ",
	Selector.toHex(approveSel),
	"// ERC20 approve",
);

const balanceOfSel = Selector.fromSignature("balanceOf(address)");
console.log(
	"balanceOf(address):        ",
	Selector.toHex(balanceOfSel),
	"// ERC20 balanceOf",
);

// Create from hex
const transferFromHex = Selector.fromHex("0x23b872dd");
console.log("\nFrom hex 0x23b872dd:      ", Selector.toHex(transferFromHex));

// Create from bytes
const swapBytes = new Uint8Array([0x38, 0xed, 0x17, 0x39]);
const swapSel = Selector.from(swapBytes);
console.log("From bytes [0x38...]:      ", Selector.toHex(swapSel));

console.log("\n=== Common ERC20 Selectors ===\n");

const erc20Selectors = {
	transfer: Selector.fromSignature("transfer(address,uint256)"),
	approve: Selector.fromSignature("approve(address,uint256)"),
	transferFrom: Selector.fromSignature("transferFrom(address,address,uint256)"),
	allowance: Selector.fromSignature("allowance(address,address)"),
	balanceOf: Selector.fromSignature("balanceOf(address)"),
	totalSupply: Selector.fromSignature("totalSupply()"),
};

for (const [name, sel] of Object.entries(erc20Selectors)) {
	console.log(`${name.padEnd(15)}: ${Selector.toHex(sel)}`);
}

console.log("\n=== Common ERC721 Selectors ===\n");

const erc721Selectors = {
	safeTransferFrom: Selector.fromSignature(
		"safeTransferFrom(address,address,uint256)",
	),
	transferFrom: Selector.fromSignature("transferFrom(address,address,uint256)"),
	approve: Selector.fromSignature("approve(address,uint256)"),
	setApprovalForAll: Selector.fromSignature("setApprovalForAll(address,bool)"),
	ownerOf: Selector.fromSignature("ownerOf(uint256)"),
	tokenURI: Selector.fromSignature("tokenURI(uint256)"),
};

for (const [name, sel] of Object.entries(erc721Selectors)) {
	console.log(`${name.padEnd(18)}: ${Selector.toHex(sel)}`);
}

console.log("\n=== Comparison Operations ===\n");

const sel1 = Selector.fromSignature("transfer(address,uint256)");
const sel2 = Selector.fromSignature("transfer(address,uint256)");
const sel3 = Selector.fromSignature("approve(address,uint256)");

console.log("transfer == transfer:", Selector.equals(sel1, sel2)); // true
console.log("transfer == approve: ", Selector.equals(sel1, sel3)); // false

console.log("\n=== Extracting from Calldata ===\n");

// Typical calldata: selector + encoded parameters
const calldata =
	"0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e0000000000000000000000000000000000000000000000000de0b6b3a7640000";
const extractedSel = Selector.from(calldata.slice(0, 10)); // "0x" + 8 hex chars
console.log("Calldata:", calldata.slice(0, 40) + "...");
console.log("Extracted selector:", Selector.toHex(extractedSel));
console.log(
	"Matches transfer:",
	Selector.equals(
		extractedSel,
		Selector.fromSignature("transfer(address,uint256)"),
	),
);

console.log("\n=== Validation ===\n");

try {
	const validSel = Selector.fromHex("0xa9059cbb");
	console.log("Valid 4-byte hex:", Selector.toHex(validSel));
} catch (e) {
	console.log("Error:", e.message);
}

try {
	Selector.fromHex("0xa9059c"); // Only 3 bytes
	console.log("Should not reach here");
} catch (e) {
	console.log("Invalid hex (3 bytes):", e.message);
}

try {
	Selector.from(new Uint8Array(5)); // 5 bytes
	console.log("Should not reach here");
} catch (e) {
	console.log("Invalid bytes (5 bytes):", e.message);
}
