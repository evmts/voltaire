import * as AccessList from "voltaire/primitives/AccessList";
import * as Address from "voltaire/primitives/Address";
import * as Hash from "voltaire/primitives/Hash";

// Storage key management in access lists
// Shows how to work with specific storage slots

console.log("Storage Key Management\n");

const token = Address.from("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"); // USDC

// ERC-20 storage layout
const BALANCE_SLOT = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);
const ALLOWANCE_SLOT = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000002",
);
const TOTAL_SUPPLY_SLOT = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000003",
);
const OWNER_SLOT = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000004",
);

// Create access list with no keys
console.log("1. Start with no storage keys");
let list = AccessList.from([{ address: token, storageKeys: [] }]);
console.log("Initial keys:", AccessList.keysFor(list, token));
console.log("Storage key count:", AccessList.storageKeyCount(list));

// Add balance slot
console.log("\n2. Add balance slot");
list = AccessList.withStorageKey(list, token, BALANCE_SLOT);
console.log("Keys:", AccessList.keysFor(list, token));
console.log(
	"Has balance slot?",
	AccessList.includesStorageKey(list, token, BALANCE_SLOT),
);

// Add allowance slot
console.log("\n3. Add allowance slot");
list = AccessList.withStorageKey(list, token, ALLOWANCE_SLOT);
console.log("Keys:", AccessList.keysFor(list, token));
console.log("Storage key count:", AccessList.storageKeyCount(list));

// Add multiple keys at once
console.log("\n4. Add multiple keys at once");
list = AccessList.from([
	{
		address: token,
		storageKeys: [BALANCE_SLOT, ALLOWANCE_SLOT, TOTAL_SUPPLY_SLOT, OWNER_SLOT],
	},
]);
console.log("All keys:", AccessList.keysFor(list, token));
console.log("Storage key count:", AccessList.storageKeyCount(list));

// Check specific keys
console.log("\n5. Check for specific keys");
console.log(
	"Has balance?",
	AccessList.includesStorageKey(list, token, BALANCE_SLOT),
);
console.log(
	"Has allowance?",
	AccessList.includesStorageKey(list, token, ALLOWANCE_SLOT),
);
console.log(
	"Has total supply?",
	AccessList.includesStorageKey(list, token, TOTAL_SUPPLY_SLOT),
);
console.log(
	"Has owner?",
	AccessList.includesStorageKey(list, token, OWNER_SLOT),
);

// Non-existent key
const randomSlot = Hash.from(
	"0x9999999999999999999999999999999999999999999999999999999999999999",
);
console.log(
	"Has random slot?",
	AccessList.includesStorageKey(list, token, randomSlot),
);

// Multiple addresses with different keys
console.log("\n6. Multiple addresses with different keys");
const usdc = Address.from("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
const dai = Address.from("0x6B175474E89094C44Da98b954EedeAC495271d0F");
const weth = Address.from("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");

const multiList = AccessList.from([
	{ address: usdc, storageKeys: [BALANCE_SLOT, ALLOWANCE_SLOT] },
	{ address: dai, storageKeys: [BALANCE_SLOT] },
	{ address: weth, storageKeys: [] },
]);

console.log("USDC keys:", AccessList.keysFor(multiList, usdc).length);
console.log("DAI keys:", AccessList.keysFor(multiList, dai).length);
console.log("WETH keys:", AccessList.keysFor(multiList, weth).length);
console.log("Total storage keys:", AccessList.storageKeyCount(multiList));

// Gas cost per key
console.log("\n7. Gas cost analysis per key");
const oneKey = AccessList.from([
	{ address: token, storageKeys: [BALANCE_SLOT] },
]);
const twoKeys = AccessList.from([
	{ address: token, storageKeys: [BALANCE_SLOT, ALLOWANCE_SLOT] },
]);
const threeKeys = AccessList.from([
	{
		address: token,
		storageKeys: [BALANCE_SLOT, ALLOWANCE_SLOT, TOTAL_SUPPLY_SLOT],
	},
]);

console.log("1 key gas cost:", AccessList.gasCost(oneKey));
console.log("2 keys gas cost:", AccessList.gasCost(twoKeys));
console.log("3 keys gas cost:", AccessList.gasCost(threeKeys));
console.log("Cost per key:", AccessList.STORAGE_KEY_COST);

// Savings per key
console.log("\n8. Savings per key");
console.log("1 key savings:", AccessList.gasSavings(oneKey));
console.log("2 keys savings:", AccessList.gasSavings(twoKeys));
console.log("3 keys savings:", AccessList.gasSavings(threeKeys));
console.log(
	"Savings per key:",
	AccessList.COLD_STORAGE_ACCESS_COST - AccessList.STORAGE_KEY_COST,
);
