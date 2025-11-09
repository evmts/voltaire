import { Keccak256 } from "../../../src/crypto/Keccak256/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

const erc20Functions = [
	"totalSupply()",
	"balanceOf(address)",
	"transfer(address,uint256)",
	"transferFrom(address,address,uint256)",
	"approve(address,uint256)",
	"allowance(address,address)",
];

for (const sig of erc20Functions) {
	const selector = Keccak256.selector(sig);
}

const erc20Events = [
	"Transfer(address,address,uint256)",
	"Approval(address,address,uint256)",
];

for (const sig of erc20Events) {
	const topic = Keccak256.topic(sig);
}

const erc721Functions = [
	"ownerOf(uint256)",
	"safeTransferFrom(address,address,uint256)",
	"safeTransferFrom(address,address,uint256,bytes)",
	"setApprovalForAll(address,bool)",
	"getApproved(uint256)",
	"isApprovedForAll(address,address)",
];

for (const sig of erc721Functions) {
	const selector = Keccak256.selector(sig);
}

const erc721Events = [
	"Transfer(address,address,uint256)",
	"Approval(address,address,uint256)",
	"ApprovalForAll(address,address,bool)",
];

for (const sig of erc721Events) {
	const topic = Keccak256.topic(sig);
}

const transferSig = "transfer(address,uint256)";
const transferSelector = Keccak256.selector(transferSig);

const transferEventSig = "Transfer(address,address,uint256)";
const transferTopic = Keccak256.topic(transferEventSig);

const customFunctions = [
	"mint(address,uint256)",
	"burn(uint256)",
	"pause()",
	"unpause()",
	"setBaseURI(string)",
	"withdraw()",
];
for (const sig of customFunctions) {
	const selector = Keccak256.selector(sig);
}

// Well-known selector for ERC-20 transfer
const knownTransferSelector = "0xa9059cbb";
const computedTransferSelector = Hex.fromBytes(
	Keccak256.selector("transfer(address,uint256)"),
);

// Well-known topic for Transfer event
const knownTransferTopic =
	"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const computedTransferTopic = Hex.fromBytes(
	Keccak256.topic("Transfer(address,address,uint256)"),
);
