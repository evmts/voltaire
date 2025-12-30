/**
 * ERC-20 transferFrom - TransferFrom encoding
 *
 * The transferFrom function allows transferring tokens on behalf of another account,
 * provided the caller has been approved to spend the tokens.
 */

import { Address, Uint256, ERC20 } from "@tevm/voltaire";

// Setup transferFrom parameters
const from = Address("0xABc0000000000000000000000000000000000001"); // Token owner
const to = Address("0xDef0000000000000000000000000000000000002"); // Recipient
const amount = Uint256(500000000000000000000n); // 500 tokens with 18 decimals

// Encode transferFrom(address,address,uint256) calldata
const calldata = ERC20.encodeTransferFrom(from, to, amount);

console.log("=== ERC-20 transferFrom Encoding ===");
console.log("From:", "0xABc0000000000000000000000000000000000001");
console.log("To:", "0xDef0000000000000000000000000000000000002");
console.log("Amount:", amount.toString(), "(500 tokens)");
console.log("Selector:", ERC20.SELECTORS.transferFrom);
console.log("\nEncoded calldata:", calldata);

// Breakdown of the calldata
console.log("\n=== Calldata Breakdown ===");
console.log("Selector (4 bytes):", calldata.slice(0, 10));
console.log("From (32 bytes):", "0x" + calldata.slice(10, 74));
console.log("To (32 bytes):", "0x" + calldata.slice(74, 138));
console.log("Amount (32 bytes):", "0x" + calldata.slice(138));

// Use case: DEX swap spending user tokens
console.log("\n=== Use Case: DEX Token Swap ===");
console.log("1. User approves DEX router to spend their tokens");
console.log("2. User calls swap function on DEX");
console.log("3. DEX router uses transferFrom to pull tokens from user");
console.log("4. DEX router sends output tokens to user");

// Decoding Transfer event (emitted by transferFrom)
console.log("\n=== Decoding Transfer Event ===");
const mockTransferLog = {
	topics: [
		ERC20.EVENTS.Transfer,
		"0x000000000000000000000000abc0000000000000000000000000000000000001", // from
		"0x000000000000000000000000def0000000000000000000000000000000000002", // to
	],
	data: "0x00000000000000000000000000000000000000000000001b1ae4d6e2ef500000", // 500 tokens
};

const decoded = ERC20.decodeTransferEvent(mockTransferLog);
console.log("From:", decoded.from);
console.log("To:", decoded.to);
console.log("Value:", decoded.value.toString());
console.log("Value (tokens):", Number(decoded.value) / 1e18);
