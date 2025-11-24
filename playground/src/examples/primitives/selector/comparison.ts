import * as Selector from "../../../primitives/Selector/index.js";

// Example: Comparing selectors and collision detection

console.log("=== Selector Comparison ===\n");

console.log("--- Basic Equality ---\n");

const sel1 = Selector.fromSignature("transfer(address,uint256)");
const sel2 = Selector.fromSignature("transfer(address,uint256)");
const sel3 = Selector.fromHex("0xa9059cbb");

console.log(`Selector 1: ${Selector.toHex(sel1)}`);
console.log(`Selector 2: ${Selector.toHex(sel2)}`);
console.log(`Selector 3: ${Selector.toHex(sel3)}\n`);

console.log(`sel1 == sel2: ${Selector.equals(sel1, sel2)}`);
console.log(`sel1 == sel3: ${Selector.equals(sel1, sel3)}`);
console.log(`Same signature -> same selector\n`);

console.log("--- Different Functions ---\n");

const transfer = Selector.fromSignature("transfer(address,uint256)");
const approve = Selector.fromSignature("approve(address,uint256)");
const transferFrom = Selector.fromSignature(
	"transferFrom(address,address,uint256)",
);

console.log(`transfer:     ${Selector.toHex(transfer)}`);
console.log(`approve:      ${Selector.toHex(approve)}`);
console.log(`transferFrom: ${Selector.toHex(transferFrom)}\n`);

console.log(`transfer == approve:      ${Selector.equals(transfer, approve)}`);
console.log(
	`transfer == transferFrom: ${Selector.equals(transfer, transferFrom)}\n`,
);

console.log("--- Overloaded Functions ---\n");

const safeTransferFrom3 = Selector.fromSignature(
	"safeTransferFrom(address,address,uint256)",
);
const safeTransferFrom4 = Selector.fromSignature(
	"safeTransferFrom(address,address,uint256,bytes)",
);

console.log(
	`safeTransferFrom(address,address,uint256):       ${Selector.toHex(safeTransferFrom3)}`,
);
console.log(
	`safeTransferFrom(address,address,uint256,bytes): ${Selector.toHex(safeTransferFrom4)}\n`,
);

console.log(
	`Different parameter lists: ${!Selector.equals(safeTransferFrom3, safeTransferFrom4)}\n`,
);

console.log("--- Parameter Type Sensitivity ---\n");

const mintUint = Selector.fromSignature("mint(uint256)");
const mintAddress = Selector.fromSignature("mint(address)");

console.log(`mint(uint256): ${Selector.toHex(mintUint)}`);
console.log(`mint(address): ${Selector.toHex(mintAddress)}`);
console.log(
	`Same name, different types: ${!Selector.equals(mintUint, mintAddress)}\n`,
);

console.log("--- Parameter Count Matters ---\n");

const burn0 = Selector.fromSignature("burn()");
const burn1 = Selector.fromSignature("burn(uint256)");
const burn2 = Selector.fromSignature("burn(address,uint256)");

console.log(`burn():                ${Selector.toHex(burn0)}`);
console.log(`burn(uint256):         ${Selector.toHex(burn1)}`);
console.log(`burn(address,uint256): ${Selector.toHex(burn2)}`);
console.log(
	`All different: ${!Selector.equals(burn0, burn1) && !Selector.equals(burn1, burn2)}\n`,
);

console.log("=== Selector Collision Analysis ===\n");

console.log("4 bytes = 2^32 possible selectors = 4,294,967,296\n");
console.log("Birthday paradox: ~50% collision chance with 77,163 functions\n");

console.log("--- Known Collisions (extremely rare) ---\n");

// These are hypothetical - real collisions are incredibly rare
console.log("Finding collisions requires brute force:");
console.log("  Generate millions of function signatures");
console.log("  Hash each with keccak256");
console.log("  Compare first 4 bytes");
console.log("  Collision found when two match\n");

console.log("Example collision structure:");
console.log("  func_A() -> 0x12345678");
console.log("  func_B(uint256,uint256,uint256,uint256) -> 0x12345678");
console.log("  Both selectors identical despite different signatures\n");

console.log("=== Building Selector Sets ===\n");

const erc20Sels = new Set([
	Selector.toHex(Selector.fromSignature("transfer(address,uint256)")),
	Selector.toHex(Selector.fromSignature("approve(address,uint256)")),
	Selector.toHex(
		Selector.fromSignature("transferFrom(address,address,uint256)"),
	),
	Selector.toHex(Selector.fromSignature("balanceOf(address)")),
	Selector.toHex(Selector.fromSignature("allowance(address,address)")),
]);

const erc721Sels = new Set([
	Selector.toHex(
		Selector.fromSignature("safeTransferFrom(address,address,uint256)"),
	),
	Selector.toHex(
		Selector.fromSignature("transferFrom(address,address,uint256)"),
	),
	Selector.toHex(Selector.fromSignature("approve(address,uint256)")),
	Selector.toHex(Selector.fromSignature("ownerOf(uint256)")),
	Selector.toHex(Selector.fromSignature("tokenURI(uint256)")),
]);

console.log(`ERC20 selector count:  ${erc20Sels.size}`);
console.log(`ERC721 selector count: ${erc721Sels.size}\n`);

// Find overlap
const overlap = new Set([...erc20Sels].filter((sel) => erc721Sels.has(sel)));

console.log(`Overlapping selectors: ${overlap.size}`);
for (const sel of overlap) {
	console.log(`  ${sel} (transferFrom, approve)`);
}

console.log("\n=== Practical Comparison Patterns ===\n");

function isERC20Call(calldata: string): boolean {
	if (calldata.length < 10) return false;
	const sel = Selector.toHex(Selector.from(calldata.slice(0, 10)));
	return erc20Sels.has(sel);
}

function isERC721Call(calldata: string): boolean {
	if (calldata.length < 10) return false;
	const sel = Selector.toHex(Selector.from(calldata.slice(0, 10)));
	return erc721Sels.has(sel);
}

const testCalldata = "0xa9059cbb" + "0".repeat(128); // transfer calldata
console.log(`Test calldata: ${testCalldata.slice(0, 20)}...`);
console.log(`Is ERC20 call:  ${isERC20Call(testCalldata)}`);
console.log(`Is ERC721 call: ${isERC721Call(testCalldata)}`);

console.log("\n--- Case Sensitivity (non-issue) ---\n");

const upperHex = Selector.fromHex("0xA9059CBB");
const lowerHex = Selector.fromHex("0xa9059cbb");

console.log(`Uppercase hex: ${Selector.toHex(upperHex)}`);
console.log(`Lowercase hex: ${Selector.toHex(lowerHex)}`);
console.log(`Equal: ${Selector.equals(upperHex, lowerHex)}`);
console.log(`Hex normalization: selectors stored as bytes, not strings\n`);
