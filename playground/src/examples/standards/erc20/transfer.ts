/**
 * ERC-20 transfer - Token transfer encoding
 *
 * The transfer function moves tokens from the caller to a recipient.
 */

import { Address, Uint256, ERC20 } from "@tevm/voltaire";

// Setup transfer parameters
const recipient = Address("0x742d35Cc6634C0532925a3b844Bc9e7595f5bEb2");
const amount = Uint256(1000000000000000000n); // 1 token with 18 decimals

// Encode transfer(address,uint256) calldata
const calldata = ERC20.encodeTransfer(recipient, amount);

console.log("=== ERC-20 transfer Encoding ===");
console.log("Recipient:", "0x742d35Cc6634C0532925a3b844Bc9e7595f5bEb2");
console.log("Amount:", amount.toString(), "(1 token with 18 decimals)");
console.log("Selector:", ERC20.SELECTORS.transfer);
console.log("\nEncoded calldata:", calldata);

// Breakdown of the calldata
console.log("\n=== Calldata Breakdown ===");
console.log("Selector (4 bytes):", calldata.slice(0, 10));
console.log("Recipient (32 bytes):", "0x" + calldata.slice(10, 74));
console.log("Amount (32 bytes):", "0x" + calldata.slice(74));

// Example: Larger transfer amounts
console.log("\n=== Various Transfer Amounts ===");
const amounts = [
	{ desc: "0.001 tokens", value: 1000000000000000n },
	{ desc: "1 token", value: 1000000000000000000n },
	{ desc: "100 tokens", value: 100000000000000000000n },
	{ desc: "1,000,000 tokens", value: 1000000000000000000000000n },
];

for (const { desc, value } of amounts) {
	const amt = Uint256(value);
	const data = ERC20.encodeTransfer(recipient, amt);
	console.log(`${desc}: ${data.slice(74)}`);
}

// Decoding a transfer return value (boolean)
console.log("\n=== Decoding Return Value ===");
const successReturn =
	"0x0000000000000000000000000000000000000000000000000000000000000001";
const failReturn =
	"0x0000000000000000000000000000000000000000000000000000000000000000";

console.log("Success return:", ERC20.decodeBool(successReturn));
console.log("Failure return:", ERC20.decodeBool(failReturn));
