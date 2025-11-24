import * as AccessList from "voltaire/primitives/AccessList";
import * as Address from "voltaire/primitives/Address";

// Empty access list scenarios
// When and why to use empty access lists

console.log("Empty Access List Scenarios\n");

// Create empty list
const empty = AccessList.create();
console.log("1. Empty access list creation");
console.log("List:", empty);
console.log("Is access list?", AccessList.is(empty));
console.log("Is empty?", AccessList.isEmpty(empty));
console.log("Length:", empty.length);

// Properties of empty list
console.log("\n2. Empty list properties");
console.log("Address count:", AccessList.addressCount(empty));
console.log("Storage key count:", AccessList.storageKeyCount(empty));
console.log("Gas cost:", AccessList.gasCost(empty));
console.log("Gas savings:", AccessList.gasSavings(empty));
console.log("Has savings?", AccessList.hasSavings(empty));

// When to use empty access list
console.log("\n3. When to use empty access list:");
console.log("- Legacy transaction (Type 0/1) without optimization");
console.log("- Simple value transfer (no contract interaction)");
console.log("- When access pattern unknown");
console.log("- Testing without optimization");

// Empty vs undefined
console.log("\n4. Empty access list in transaction");
const txWithEmpty = {
	type: 1, // EIP-2930
	chainId: 1,
	nonce: 42,
	gasPrice: 50000000000n,
	gasLimit: 21000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1000000000000000000n, // 1 ETH
	data: "0x",
	accessList: empty, // Empty but present
};

console.log("Transaction with empty access list:");
console.log("Type:", txWithEmpty.type);
console.log("Access list present?", txWithEmpty.accessList !== undefined);
console.log("Access list empty?", AccessList.isEmpty(txWithEmpty.accessList));

// Building from empty
console.log("\n5. Building from empty");
let list = AccessList.create();
console.log("Initial:", AccessList.isEmpty(list));

const usdc = Address.from("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
list = AccessList.withAddress(list, usdc, []);
console.log("After adding address:", AccessList.isEmpty(list));
console.log("Address count:", AccessList.addressCount(list));

// Compare empty to populated
console.log("\n6. Empty vs populated comparison");
const populated = AccessList.from([{ address: usdc, storageKeys: [] }]);

console.log("Empty is empty?", AccessList.isEmpty(empty));
console.log("Populated is empty?", AccessList.isEmpty(populated));
console.log("Empty address count:", AccessList.addressCount(empty));
console.log("Populated address count:", AccessList.addressCount(populated));

// Merge with empty
console.log("\n7. Merging with empty");
const list1 = AccessList.from([{ address: usdc, storageKeys: [] }]);
const merged = AccessList.merge(empty, list1);
console.log("Empty + List:", merged);
console.log("Result is empty?", AccessList.isEmpty(merged));

const mergedReverse = AccessList.merge(list1, empty);
console.log("List + Empty:", mergedReverse);
console.log(
	"Same result?",
	JSON.stringify(merged) === JSON.stringify(mergedReverse),
);

// Cost comparison
console.log("\n8. Cost comparison");
console.log("Empty list gas cost:", AccessList.gasCost(empty));
console.log("One address (no keys):", AccessList.gasCost(populated));
console.log(
	"Additional cost:",
	AccessList.gasCost(populated) - AccessList.gasCost(empty),
);

// Validation
console.log("\n9. Empty list validation");
try {
	AccessList.assertValid(empty);
	console.log("Empty list is valid");
} catch (error) {
	console.log("Validation failed:", error);
}

// Type checking
console.log("\n10. Type checking");
console.log("Is access list?", AccessList.is(empty));
console.log("Is array?", Array.isArray(empty));
console.log("Is readonly array?", Array.isArray(empty));
