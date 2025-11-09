import { Keccak256 } from "../../../src/crypto/Keccak256/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

/**
 * Ethereum Function Selectors and Event Topics
 *
 * Demonstrates Keccak256's role in Ethereum's ABI:
 * - Function selectors (first 4 bytes of signature hash)
 * - Event topics (full 32-byte signature hash)
 * - Common ERC-20 and ERC-721 examples
 */

console.log("=== Ethereum Function Selectors & Event Topics ===\n");

// 1. ERC-20 Function Selectors
console.log("1. ERC-20 Function Selectors");
console.log("-".repeat(40));

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
	console.log(`${sig.padEnd(40)} ${Hex.fromBytes(selector)}`);
}
console.log();

// 2. ERC-20 Event Topics
console.log("2. ERC-20 Event Topics");
console.log("-".repeat(40));

const erc20Events = [
	"Transfer(address,address,uint256)",
	"Approval(address,address,uint256)",
];

for (const sig of erc20Events) {
	const topic = Keccak256.topic(sig);
	console.log(`${sig}`);
	console.log(`  ${Hex.fromBytes(topic)}\n`);
}

// 3. ERC-721 Function Selectors
console.log("3. ERC-721 Function Selectors");
console.log("-".repeat(40));

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
	console.log(`${sig.padEnd(50)} ${Hex.fromBytes(selector)}`);
}
console.log();

// 4. ERC-721 Event Topics
console.log("4. ERC-721 Event Topics");
console.log("-".repeat(40));

const erc721Events = [
	"Transfer(address,address,uint256)",
	"Approval(address,address,uint256)",
	"ApprovalForAll(address,address,bool)",
];

for (const sig of erc721Events) {
	const topic = Keccak256.topic(sig);
	console.log(`${sig}`);
	console.log(`  ${Hex.fromBytes(topic)}\n`);
}

// 5. Constructing Transaction Calldata
console.log("5. Constructing Transaction Calldata");
console.log("-".repeat(40));
console.log("Example: ERC-20 transfer(address,uint256)\n");

const transferSig = "transfer(address,uint256)";
const transferSelector = Keccak256.selector(transferSig);

console.log(`Function signature: ${transferSig}`);
console.log(`Selector (4 bytes): ${Hex.fromBytes(transferSelector)}`);
console.log("\nCalldata structure:");
console.log("  [0:4]   Function selector");
console.log("  [4:36]  Recipient address (padded to 32 bytes)");
console.log("  [36:68] Amount (uint256)");
console.log("\nExample calldata:");
console.log(`  ${Hex.fromBytes(transferSelector)}`);
console.log(
	"  000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f51e3e",
);
console.log(
	"  0000000000000000000000000000000000000000000000000de0b6b3a7640000\n",
);

// 6. Parsing Event Logs
console.log("6. Parsing Event Logs");
console.log("-".repeat(40));
console.log("Event logs contain topics[0] = event signature hash\n");

const transferEventSig = "Transfer(address,address,uint256)";
const transferTopic = Keccak256.topic(transferEventSig);

console.log(`Event signature: ${transferEventSig}`);
console.log(`Topic hash:      ${Hex.fromBytes(transferTopic)}`);
console.log("\nLog structure:");
console.log("  topics[0] = event signature hash (Transfer)");
console.log("  topics[1] = indexed parameter 1 (from address)");
console.log("  topics[2] = indexed parameter 2 (to address)");
console.log("  data      = non-indexed parameters (amount)\n");

// 7. Custom Contract Examples
console.log("7. Custom Contract Examples");
console.log("-".repeat(40));

const customFunctions = [
	"mint(address,uint256)",
	"burn(uint256)",
	"pause()",
	"unpause()",
	"setBaseURI(string)",
	"withdraw()",
];

console.log("Custom contract function selectors:\n");
for (const sig of customFunctions) {
	const selector = Keccak256.selector(sig);
	console.log(`${sig.padEnd(30)} ${Hex.fromBytes(selector)}`);
}
console.log();

// 8. Verifying Known Selectors
console.log("8. Verifying Known Selectors");
console.log("-".repeat(40));

// Well-known selector for ERC-20 transfer
const knownTransferSelector = "0xa9059cbb";
const computedTransferSelector = Hex.fromBytes(
	Keccak256.selector("transfer(address,uint256)"),
);

console.log(`Known selector:    ${knownTransferSelector}`);
console.log(`Computed selector: ${computedTransferSelector}`);
console.log(`Match: ${knownTransferSelector === computedTransferSelector}`);
console.log();

// Well-known topic for Transfer event
const knownTransferTopic =
	"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const computedTransferTopic = Hex.fromBytes(
	Keccak256.topic("Transfer(address,address,uint256)"),
);

console.log(`Known topic:    ${knownTransferTopic}`);
console.log(`Computed topic: ${computedTransferTopic}`);
console.log(`Match: ${knownTransferTopic === computedTransferTopic}\n`);

console.log("=== Complete ===");
