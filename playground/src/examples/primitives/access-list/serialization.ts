import * as AccessList from "voltaire/primitives/AccessList";
import * as Address from "voltaire/primitives/Address";
import * as Hash from "voltaire/primitives/Hash";
import * as Hex from "voltaire/primitives/Hex";

// Access list serialization and deserialization
// Shows RLP encoding/decoding for transactions

console.log("Access List Serialization\n");

// Create access list
const usdc = Address.from("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
const weth = Address.from("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
const slot1 = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);
const slot2 = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000002",
);

const accessList = AccessList.from([
	{ address: usdc, storageKeys: [slot1, slot2] },
	{ address: weth, storageKeys: [slot1] },
]);

console.log("1. Original access list");
console.log("List:", accessList);
console.log("Addresses:", AccessList.addressCount(accessList));
console.log("Storage keys:", AccessList.storageKeyCount(accessList));

// Serialize to bytes
console.log("\n2. Serialize to bytes (RLP)");
const bytes = AccessList.toBytes(accessList);
console.log("Bytes:", bytes);
console.log("Byte length:", bytes.length);
console.log("Hex representation:", Hex.from(bytes));

// Deserialize from bytes
console.log("\n3. Deserialize from bytes");
const deserialized = AccessList.fromBytes(bytes);
console.log("Deserialized:", deserialized);
console.log("Addresses:", AccessList.addressCount(deserialized));
console.log("Storage keys:", AccessList.storageKeyCount(deserialized));

// Verify round-trip
console.log("\n4. Verify round-trip");
const reserializedBytes = AccessList.toBytes(deserialized);
console.log("Original bytes:", Hex.from(bytes));
console.log("Reserialized bytes:", Hex.from(reserializedBytes));
console.log("Bytes match?", Hex.from(bytes) === Hex.from(reserializedBytes));

// Structure comparison
console.log("\n5. Structure comparison");
console.log(
	"Same address count?",
	AccessList.addressCount(accessList) === AccessList.addressCount(deserialized),
);
console.log(
	"Same storage key count?",
	AccessList.storageKeyCount(accessList) ===
		AccessList.storageKeyCount(deserialized),
);
console.log(
	"Same gas cost?",
	AccessList.gasCost(accessList) === AccessList.gasCost(deserialized),
);

// Empty access list serialization
console.log("\n6. Empty access list serialization");
const empty = AccessList.create();
const emptyBytes = AccessList.toBytes(empty);
console.log("Empty bytes:", emptyBytes);
console.log("Empty byte length:", emptyBytes.length);
console.log("Empty hex:", Hex.from(emptyBytes));

const emptyDeserialized = AccessList.fromBytes(emptyBytes);
console.log("Deserialized empty:", emptyDeserialized);
console.log("Is empty?", AccessList.isEmpty(emptyDeserialized));

// Single address, no keys
console.log("\n7. Single address serialization (no keys)");
const singleAddr = AccessList.from([{ address: usdc, storageKeys: [] }]);
const singleBytes = AccessList.toBytes(singleAddr);
console.log("Bytes:", Hex.from(singleBytes));
console.log("Byte length:", singleBytes.length);

const singleDeserialized = AccessList.fromBytes(singleBytes);
console.log("Deserialized:", singleDeserialized);
console.log("Keys:", AccessList.keysFor(singleDeserialized, usdc).length);

// Large access list
console.log("\n8. Large access list serialization");
const largeList = AccessList.from([
	{ address: usdc, storageKeys: [slot1, slot2] },
	{ address: weth, storageKeys: [slot1, slot2] },
	{
		address: Address.from("0x6B175474E89094C44Da98b954EedeAC495271d0F"),
		storageKeys: [slot1],
	},
	{
		address: Address.from("0xdAC17F958D2ee523a2206206994597C13D831ec7"),
		storageKeys: [],
	},
]);

const largeBytes = AccessList.toBytes(largeList);
console.log("Addresses:", AccessList.addressCount(largeList));
console.log("Storage keys:", AccessList.storageKeyCount(largeList));
console.log("Byte length:", largeBytes.length);
console.log("Hex (truncated):", Hex.from(largeBytes).slice(0, 66) + "...");

const largeDeserialized = AccessList.fromBytes(largeBytes);
console.log(
	"Deserialized addresses:",
	AccessList.addressCount(largeDeserialized),
);
console.log(
	"Deserialized keys:",
	AccessList.storageKeyCount(largeDeserialized),
);

// Efficiency analysis
console.log("\n9. Serialization efficiency");
const baselineSize = 20; // Address size
const keySize = 32; // Storage key size
const expectedSize =
	AccessList.addressCount(accessList) * baselineSize +
	AccessList.storageKeyCount(accessList) * keySize;

console.log("Addresses:", AccessList.addressCount(accessList));
console.log("Storage keys:", AccessList.storageKeyCount(accessList));
console.log("Expected minimum size:", expectedSize, "bytes");
console.log("Actual size:", bytes.length, "bytes");
console.log("Overhead:", bytes.length - expectedSize, "bytes");
console.log(
	"Overhead percentage:",
	(((bytes.length - expectedSize) / expectedSize) * 100).toFixed(2) + "%",
);
