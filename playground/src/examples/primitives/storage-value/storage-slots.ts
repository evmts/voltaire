import { StorageValue, Bytes, Bytes32 } from "@tevm/voltaire";

// Example: Working with EVM storage slots

// Simple storage slot (counter at slot 0)
const counterSlot = StorageValue(42n);

// ERC20 token storage layout example
// Slot 0: totalSupply
// Slot 1: name (string)
// Slot 2: symbol (string)
// Slot 3: decimals

const totalSupply = StorageValue(1_000_000n * 10n ** 18n);
const decimals = StorageValue(18n);

// Mapping storage slot calculation
// Storage slot for mapping(address => uint256) balances
// slot = keccak256(abi.encode(key, mappingSlot))

// Example balance value
const balance = StorageValue(500n * 10n ** 18n);

// Array length storage
const arrayLength = StorageValue(10n);

// Nested mapping: mapping(address => mapping(address => uint256))
// Example: ERC20 allowances
const allowance = StorageValue(100n * 10n ** 18n);

// Struct storage (packed into single slot)
// struct Info { uint128 amount; uint64 timestamp; uint64 flags; }

const createStructStorage = (
	amount: bigint,
	timestamp: bigint,
	flags: bigint,
): StorageValue.StorageValueType => {
	const bytes = Bytes32.zero();

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

	return StorageValue(bytes);
};

const structStorage = createStructStorage(1000n * 10n ** 18n, 1700000000n, 5n);

// Storage gas refund pattern (writing zero)
const initialValue = StorageValue(1000n);
const clearedValue = StorageValue(0n);

// Slot collision detection (should be impossible with keccak256)
const slot1 = StorageValue(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);
const slot2 = StorageValue(
	"0x0000000000000000000000000000000000000000000000000000000000000002",
);

// Uninitialized storage (reads as zero)
const uninitialized = StorageValue(0n);

// Storage warmup/coldness (SLOAD gas costs)
// First access: cold (2100 gas)
// Subsequent: warm (100 gas)
// Values track which slots were accessed

const coldSlot = StorageValue(100n);

// Constant storage keys (named slots)
const OWNER_SLOT = StorageValue(
	"0x0000000000000000000000000000000000000000000000000000000000000000",
);
const PAUSED_SLOT = StorageValue(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);

// EIP-1967 proxy storage slots (avoid collisions)
// Implementation slot: keccak256("eip1967.proxy.implementation") - 1
const proxyImplSlot = StorageValue(
	"0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc",
);

// Admin slot: keccak256("eip1967.proxy.admin") - 1
const proxyAdminSlot = StorageValue(
	"0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103",
);

// Storage array element calculation
// For dynamic array at slot p, element i is at keccak256(p) + i
const arrayBaseSlot = StorageValue(5n);
const elementIndex = 3n;
const elementValue = StorageValue(999n);

// Bytes/string length encoding
// If length <= 31: last byte = length * 2
// If length >= 32: last byte = length * 2 + 1, actual data in separate slot

const shortStringLength = StorageValue(20n); // 10 chars (length*2)
const longStringMarker = StorageValue(65n); // 32+ chars (length*2 + 1)
