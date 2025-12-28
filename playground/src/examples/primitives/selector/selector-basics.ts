import { Selector } from "voltaire";
// Create from function signature (most common)
const transferSel = Selector.fromSignature("transfer(address,uint256)");

const approveSel = Selector.fromSignature("approve(address,uint256)");

const balanceOfSel = Selector.fromSignature("balanceOf(address)");

// Create from hex
const transferFromHex = Selector.fromHex("0x23b872dd");

// Create from bytes
const swapBytes = new Uint8Array([0x38, 0xed, 0x17, 0x39]);
const swapSel = Selector.from(swapBytes);

const erc20Selectors = {
	transfer: Selector.fromSignature("transfer(address,uint256)"),
	approve: Selector.fromSignature("approve(address,uint256)"),
	transferFrom: Selector.fromSignature("transferFrom(address,address,uint256)"),
	allowance: Selector.fromSignature("allowance(address,address)"),
	balanceOf: Selector.fromSignature("balanceOf(address)"),
	totalSupply: Selector.fromSignature("totalSupply()"),
};

for (const [name, sel] of Object.entries(erc20Selectors)) {
}

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
}

const sel1 = Selector.fromSignature("transfer(address,uint256)");
const sel2 = Selector.fromSignature("transfer(address,uint256)");
const sel3 = Selector.fromSignature("approve(address,uint256)");

// Typical calldata: selector + encoded parameters
const calldata =
	"0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e0000000000000000000000000000000000000000000000000de0b6b3a7640000";
const extractedSel = Selector.from(calldata.slice(0, 10)); // "0x" + 8 hex chars

try {
	const validSel = Selector.fromHex("0xa9059cbb");
} catch (e) {}

try {
	Selector.fromHex("0xa9059c"); // Only 3 bytes
} catch (e) {}

try {
	Selector.from(new Uint8Array(5)); // 5 bytes
} catch (e) {}
