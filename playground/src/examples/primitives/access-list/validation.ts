import * as AccessList from "voltaire/primitives/AccessList";
import * as Address from "voltaire/primitives/Address";
import * as Hash from "voltaire/primitives/Hash";

// Access list validation and type checking
// Shows how to validate access list structure

console.log("Access List Validation\n");

// Valid access list
const validList = AccessList.from([
	{
		address: Address.from("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"),
		storageKeys: [
			Hash.from(
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			),
		],
	},
]);

console.log("1. Valid access list");
console.log("Is access list?", AccessList.is(validList));
console.log("Content:", validList);

// Check item structure
console.log("\n2. Item validation");
const item = validList[0];
console.log("Is valid item?", AccessList.isItem(item));
console.log("Item:", item);

// Empty access list
console.log("\n3. Empty access list");
const empty = AccessList.create();
console.log("Is access list?", AccessList.is(empty));
console.log("Is empty?", AccessList.isEmpty(empty));
console.log("Address count:", AccessList.addressCount(empty));
console.log("Storage key count:", AccessList.storageKeyCount(empty));

// Access list with no storage keys
console.log("\n4. Access list without storage keys");
const noKeys = AccessList.from([
	{
		address: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
		storageKeys: [],
	},
]);
console.log("Is access list?", AccessList.is(noKeys));
console.log("Is empty?", AccessList.isEmpty(noKeys));
console.log("Has keys?", AccessList.storageKeyCount(noKeys) > 0);

// Multiple addresses
console.log("\n5. Multiple addresses validation");
const multiple = AccessList.from([
	{
		address: Address.from("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"),
		storageKeys: [
			Hash.from(
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			),
		],
	},
	{
		address: Address.from("0x6B175474E89094C44Da98b954EedeAC495271d0F"),
		storageKeys: [],
	},
]);

console.log("Is access list?", AccessList.is(multiple));
console.log("Address count:", AccessList.addressCount(multiple));
console.log(
	"All items valid?",
	multiple.every((item) => AccessList.isItem(item)),
);

// Assert valid
console.log("\n6. Assert validation");
try {
	AccessList.assertValid(validList);
	console.log("Valid list passed assertion");
} catch (error) {
	console.log("Validation failed:", error);
}

// Check address inclusion
console.log("\n7. Address inclusion checks");
const usdc = Address.from("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
const dai = Address.from("0x6B175474E89094C44Da98b954EedeAC495271d0F");
const weth = Address.from("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");

const list = AccessList.from([
	{ address: usdc, storageKeys: [] },
	{ address: dai, storageKeys: [] },
]);

console.log("Includes USDC?", AccessList.includesAddress(list, usdc));
console.log("Includes DAI?", AccessList.includesAddress(list, dai));
console.log("Includes WETH?", AccessList.includesAddress(list, weth));

// Check storage key inclusion
console.log("\n8. Storage key inclusion checks");
const slot1 = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);
const slot2 = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000002",
);
const slot3 = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000003",
);

const listWithKeys = AccessList.from([
	{ address: usdc, storageKeys: [slot1, slot2] },
]);

console.log(
	"USDC has slot1?",
	AccessList.includesStorageKey(listWithKeys, usdc, slot1),
);
console.log(
	"USDC has slot2?",
	AccessList.includesStorageKey(listWithKeys, usdc, slot2),
);
console.log(
	"USDC has slot3?",
	AccessList.includesStorageKey(listWithKeys, usdc, slot3),
);
console.log(
	"DAI has slot1?",
	AccessList.includesStorageKey(listWithKeys, dai, slot1),
);

// Gas validation
console.log("\n9. Gas calculation validation");
console.log("Empty list cost:", AccessList.gasCost(empty));
console.log("Empty list savings:", AccessList.gasSavings(empty));
console.log("Empty list has savings?", AccessList.hasSavings(empty));

console.log("\nNon-empty list cost:", AccessList.gasCost(validList));
console.log("Non-empty list savings:", AccessList.gasSavings(validList));
console.log("Non-empty list has savings?", AccessList.hasSavings(validList));

// Immutability check
console.log("\n10. Immutability validation");
const original = AccessList.from([{ address: usdc, storageKeys: [slot1] }]);
const modified = AccessList.withStorageKey(original, usdc, slot2);

console.log("Original keys:", AccessList.keysFor(original, usdc).length);
console.log("Modified keys:", AccessList.keysFor(modified, usdc).length);
console.log(
	"Original unchanged?",
	AccessList.keysFor(original, usdc).length === 1,
);
