import * as StorageValue from "../../../primitives/StorageValue/index.js";

// Example: Working with EVM storage slots

// Simple storage slot (counter at slot 0)
const counterSlot = StorageValue.from(42n);
console.log("Counter value:", StorageValue.toUint256(counterSlot));
console.log("Storage:", StorageValue.toHex(counterSlot));

// ERC20 token storage layout example
// Slot 0: totalSupply
// Slot 1: name (string)
// Slot 2: symbol (string)
// Slot 3: decimals

const totalSupply = StorageValue.from(1_000_000n * 10n ** 18n);
const decimals = StorageValue.from(18n);

console.log("\nERC20 Storage Layout:");
console.log("Slot 0 (totalSupply):", StorageValue.toHex(totalSupply));
console.log("As tokens:", Number(StorageValue.toUint256(totalSupply)) / 1e18);
console.log("Slot 3 (decimals):", StorageValue.toHex(decimals));

// Mapping storage slot calculation
// Storage slot for mapping(address => uint256) balances
// slot = keccak256(abi.encode(key, mappingSlot))

// Example balance value
const balance = StorageValue.from(500n * 10n ** 18n);
console.log("\nMapping value (balance):", StorageValue.toHex(balance));
console.log("As tokens:", Number(StorageValue.toUint256(balance)) / 1e18);

// Array length storage
const arrayLength = StorageValue.from(10n);
console.log("\nDynamic array length:", StorageValue.toUint256(arrayLength));
console.log("Storage:", StorageValue.toHex(arrayLength));

// Nested mapping: mapping(address => mapping(address => uint256))
// Example: ERC20 allowances
const allowance = StorageValue.from(100n * 10n ** 18n);
console.log("\nNested mapping (allowance):", StorageValue.toHex(allowance));
console.log("As tokens:", Number(StorageValue.toUint256(allowance)) / 1e18);

// Struct storage (packed into single slot)
// struct Info { uint128 amount; uint64 timestamp; uint64 flags; }

const createStructStorage = (
	amount: bigint,
	timestamp: bigint,
	flags: bigint,
): StorageValue.StorageValueType => {
	const bytes = new Uint8Array(32);

	// uint128 amount (bytes 0-15)
	for (let i = 0; i < 16; i++) {
		bytes[i] = Number((amount >> BigInt((15 - i) * 8)) & 0xffn);
	}

	// uint64 timestamp (bytes 16-23)
	for (let i = 0; i < 8; i++) {
		bytes[16 + i] = Number((timestamp >> BigInt((7 - i) * 8)) & 0xffn);
	}

	// uint64 flags (bytes 24-31)
	for (let i = 0; i < 8; i++) {
		bytes[24 + i] = Number((flags >> BigInt((7 - i) * 8)) & 0xffn);
	}

	return StorageValue.from(bytes);
};

const structStorage = createStructStorage(1000n * 10n ** 18n, 1700000000n, 5n);
console.log("\nStruct storage:", StorageValue.toHex(structStorage));

// Storage gas refund pattern (writing zero)
const initialValue = StorageValue.from(1000n);
const clearedValue = StorageValue.from(0n);

console.log("\nStorage gas refund:");
console.log("Initial:", StorageValue.toHex(initialValue));
console.log("Cleared:", StorageValue.toHex(clearedValue));
console.log("Is cleared:", StorageValue.toUint256(clearedValue) === 0n);

// Slot collision detection (should be impossible with keccak256)
const slot1 = StorageValue.from(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);
const slot2 = StorageValue.from(
	"0x0000000000000000000000000000000000000000000000000000000000000002",
);

console.log("\nSlot comparison:");
console.log("Slot 1:", StorageValue.toHex(slot1));
console.log("Slot 2:", StorageValue.toHex(slot2));
console.log("Same slot:", StorageValue.equals(slot1, slot2));

// Uninitialized storage (reads as zero)
const uninitialized = StorageValue.from(0n);
console.log("\nUninitialized storage:", StorageValue.toHex(uninitialized));
console.log("Is empty:", StorageValue.toUint256(uninitialized) === 0n);

// Storage warmup/coldness (SLOAD gas costs)
// First access: cold (2100 gas)
// Subsequent: warm (100 gas)
// Values track which slots were accessed

const coldSlot = StorageValue.from(100n);
console.log("\nCold storage access:", StorageValue.toHex(coldSlot));
console.log("Value:", StorageValue.toUint256(coldSlot));

// Constant storage keys (named slots)
const OWNER_SLOT = StorageValue.from(
	"0x0000000000000000000000000000000000000000000000000000000000000000",
);
const PAUSED_SLOT = StorageValue.from(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);

console.log("\nNamed storage slots:");
console.log("OWNER_SLOT:", StorageValue.toHex(OWNER_SLOT));
console.log("PAUSED_SLOT:", StorageValue.toHex(PAUSED_SLOT));

// EIP-1967 proxy storage slots (avoid collisions)
// Implementation slot: keccak256("eip1967.proxy.implementation") - 1
const proxyImplSlot = StorageValue.from(
	"0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc",
);

console.log("\nEIP-1967 proxy slot:");
console.log("Implementation:", StorageValue.toHex(proxyImplSlot));

// Admin slot: keccak256("eip1967.proxy.admin") - 1
const proxyAdminSlot = StorageValue.from(
	"0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103",
);

console.log("Admin:", StorageValue.toHex(proxyAdminSlot));

// Storage array element calculation
// For dynamic array at slot p, element i is at keccak256(p) + i
const arrayBaseSlot = StorageValue.from(5n);
const elementIndex = 3n;
const elementValue = StorageValue.from(999n);

console.log("\nArray storage:");
console.log("Base slot:", StorageValue.toUint256(arrayBaseSlot));
console.log("Element index:", elementIndex);
console.log("Element value:", StorageValue.toHex(elementValue));

// Bytes/string length encoding
// If length <= 31: last byte = length * 2
// If length >= 32: last byte = length * 2 + 1, actual data in separate slot

const shortStringLength = StorageValue.from(20n); // 10 chars (length*2)
const longStringMarker = StorageValue.from(65n); // 32+ chars (length*2 + 1)

console.log("\nString length encoding:");
console.log("Short string (20):", StorageValue.toHex(shortStringLength));
console.log("Long string marker (65):", StorageValue.toHex(longStringMarker));
