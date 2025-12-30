import { Hex, Keccak256, Selector } from "@tevm/voltaire";

// Function and event selectors
console.log("Function Selectors:");

// Create function selectors from signatures
const transferSig = "transfer(address,uint256)";
const transferSelector = Selector.fromSignature(transferSig);
console.log(`  ${transferSig}: ${Selector.toHex(transferSelector)}`);

const approveSig = "approve(address,uint256)";
const approveSelector = Selector.fromSignature(approveSig);
console.log(`  ${approveSig}: ${Selector.toHex(approveSelector)}`);

const balanceOfSig = "balanceOf(address)";
const balanceOfSelector = Selector.fromSignature(balanceOfSig);
console.log(`  ${balanceOfSig}: ${Selector.toHex(balanceOfSelector)}`);

// Compare selectors
const selector1 = Selector.fromHex("0xa9059cbb");
const selector2 = Selector.fromSignature("transfer(address,uint256)");
console.log("\nSelector comparison:");
console.log(
	`  0xa9059cbb === transfer selector: ${Selector.equals(selector1, selector2)}`,
);

// Event topic calculation (full keccak256 hash, not truncated)
console.log("\nEvent Topics:");
const transferEventSig = "Transfer(address,address,uint256)";
const transferTopic = Keccak256.hash(
	new TextEncoder().encode(transferEventSig),
);
console.log(`  ${transferEventSig}: ${Hex.fromBytes(transferTopic)}`);

const approvalEventSig = "Approval(address,address,uint256)";
const approvalTopic = Keccak256.hash(
	new TextEncoder().encode(approvalEventSig),
);
console.log(`  ${approvalEventSig}: ${Hex.fromBytes(approvalTopic)}`);

// ERC-20 method selectors
console.log("\nERC-20 Method Selectors:");
const erc20Methods = [
	"name()",
	"symbol()",
	"decimals()",
	"totalSupply()",
	"balanceOf(address)",
	"transfer(address,uint256)",
	"approve(address,uint256)",
	"allowance(address,address)",
	"transferFrom(address,address,uint256)",
];
for (const method of erc20Methods) {
	const sel = Selector.fromSignature(method);
	console.log(`  ${method}: ${Selector.toHex(sel)}`);
}

// Create selector from raw bytes
const rawSelector = Selector.from(new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]));
console.log("\nSelector from raw bytes:", Selector.toHex(rawSelector));
