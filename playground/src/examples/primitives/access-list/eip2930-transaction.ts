import * as AccessList from "voltaire/primitives/AccessList";
import * as Address from "voltaire/primitives/Address";
import * as Hash from "voltaire/primitives/Hash";

// EIP-2930 transaction with access list
// Type 1 transactions introduce access lists for gas optimization

console.log("EIP-2930 Transaction Access List Example\n");

// Scenario: Transfer USDC tokens
const usdc = Address.from("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
const sender = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const recipient = Address.from("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");

// Storage slots for ERC-20 balances (keccak256 of address + slot)
// Simplified: using placeholder slots for demonstration
const senderBalanceSlot = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);
const recipientBalanceSlot = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000002",
);

// Build access list for token transfer
const accessList = AccessList.from([
	{
		address: usdc,
		storageKeys: [senderBalanceSlot, recipientBalanceSlot],
	},
]);

console.log("Transaction type: EIP-2930 (Type 1)");
console.log("Action: USDC transfer");
console.log("Access list:", accessList);

// Gas analysis
const cost = AccessList.gasCost(accessList);
const savings = AccessList.gasSavings(accessList);
console.log("\nGas Analysis:");
console.log("Access list cost:", cost, "gas");
console.log("Expected savings:", savings, "gas");
console.log("Net benefit:", savings - cost, "gas");

// Validate access list structure
console.log("\nValidation:");
console.log("Valid access list?", AccessList.is(accessList));
console.log("Contains USDC?", AccessList.includesAddress(accessList, usdc));
console.log(
	"Contains sender balance?",
	AccessList.includesStorageKey(accessList, usdc, senderBalanceSlot),
);
console.log(
	"Contains recipient balance?",
	AccessList.includesStorageKey(accessList, usdc, recipientBalanceSlot),
);

// EIP-2930 transaction structure
const transaction = {
	type: 1, // EIP-2930
	chainId: 1,
	nonce: 42,
	gasPrice: 50000000000n, // 50 gwei
	gasLimit: 100000n,
	to: usdc,
	value: 0n,
	data: "0xa9059cbb...", // transfer(address,uint256)
	accessList: accessList,
};

console.log("\nTransaction structure:");
console.log(
	JSON.stringify(
		transaction,
		(_, v) => (typeof v === "bigint" ? v.toString() : v),
		2,
	),
);
