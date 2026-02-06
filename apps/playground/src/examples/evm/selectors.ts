import { Hex, Keccak256, Selector } from "@tevm/voltaire";

// Create function selectors from signatures
const transferSig = "transfer(address,uint256)";
const transferSelector = Selector.fromSignature(transferSig);

const approveSig = "approve(address,uint256)";
const approveSelector = Selector.fromSignature(approveSig);

const balanceOfSig = "balanceOf(address)";
const balanceOfSelector = Selector.fromSignature(balanceOfSig);

// Compare selectors
const selector1 = Selector.fromHex("0xa9059cbb");
const selector2 = Selector.fromSignature("transfer(address,uint256)");
const transferEventSig = "Transfer(address,address,uint256)";
const transferTopic = Keccak256.hash(
	new TextEncoder().encode(transferEventSig),
);

const approvalEventSig = "Approval(address,address,uint256)";
const approvalTopic = Keccak256.hash(
	new TextEncoder().encode(approvalEventSig),
);
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
}

// Create selector from raw bytes
const rawSelector = Selector.from(new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]));
