import { StorageValue, Bytes, Bytes32 } from "@tevm/voltaire";

// Example: Packed storage values - multiple values in a single 32-byte slot

// In Solidity, multiple small values can be packed into one storage slot to save gas
// Example: struct { uint128 a; uint64 b; uint64 c; } fits in one slot

// Create a packed value with multiple fields
// Layout: [uint128 value][uint64 timestamp][uint64 flags]

const packedValue = (): StorageValue.StorageValueType => {
	const bytes = Bytes32.zero();

	// uint128 value at bytes 0-15 (1000 tokens with 18 decimals)
	const value = 1000n * 10n ** 18n;
	const valueBytes = Bytes.zero(16);
	for (let i = 15; i >= 0; i--) {
		valueBytes[i] = Number((value >> BigInt((15 - i) * 8)) & 0xffn);
	}
	bytes.set(valueBytes, 0);

	// uint64 timestamp at bytes 16-23 (Unix timestamp)
	const timestamp = 1700000000n; // Nov 2023
	for (let i = 0; i < 8; i++) {
		bytes[16 + i] = Number((timestamp >> BigInt((7 - i) * 8)) & 0xffn);
	}

	// uint64 flags at bytes 24-31 (bit flags)
	const flags = 0b1010n; // Some flags set
	for (let i = 0; i < 8; i++) {
		bytes[24 + i] = Number((flags >> BigInt((7 - i) * 8)) & 0xffn);
	}

	return StorageValue(bytes);
};

const packed = packedValue();

// Extract uint128 from bytes 0-15
const extractUint128 = (storage: Uint8Array): bigint => {
	let result = 0n;
	for (let i = 0; i < 16; i++) {
		result = (result << 8n) | BigInt(storage[i]);
	}
	return result;
};

// Extract uint64 from specific offset
const extractUint64 = (storage: Uint8Array, offset: number): bigint => {
	let result = 0n;
	for (let i = 0; i < 8; i++) {
		result = (result << 8n) | BigInt(storage[offset + i]);
	}
	return result;
};

// Example 2: Packed address + uint96
// Common pattern: owner (address, 20 bytes) + balance (uint96, 12 bytes)

const packAddressUint96 = (
	address: string,
	amount: bigint,
): StorageValue.StorageValueType => {
	const bytes = Bytes32.zero();

	// Address in first 20 bytes (remove 0x prefix)
	const addrBytes = address.slice(2).match(/.{2}/g) || [];
	for (let i = 0; i < 20; i++) {
		bytes[i] = Number.parseInt(addrBytes[i] || "00", 16);
	}

	// uint96 in last 12 bytes
	for (let i = 0; i < 12; i++) {
		bytes[20 + i] = Number((amount >> BigInt((11 - i) * 8)) & 0xffn);
	}

	return StorageValue(bytes);
};

const packedAddr = packAddressUint96(
	"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
	1000000n,
);

// Extract address (first 20 bytes)
const extractPackedAddress = (storage: Uint8Array): string => {
	const addrBytes = storage.slice(0, 20);
	return `0x${Array.from(addrBytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
};

// Extract uint96 (last 12 bytes)
const extractUint96 = (storage: Uint8Array): bigint => {
	let result = 0n;
	for (let i = 20; i < 32; i++) {
		result = (result << 8n) | BigInt(storage[i]);
	}
	return result;
};

// Example 3: Multiple uint8 values (32 individual bytes)
const packedBytes = Bytes32.zero();
for (let i = 0; i < 32; i++) {
	packedBytes[i] = i * 8; // 0, 8, 16, 24, ...
}
const multiPacked = StorageValue(packedBytes);

// Example 4: Bit flags (256 individual bits)
const flagsStorage = Bytes32.zero();
flagsStorage[0] = 0b10101010; // Set some flags in first byte
flagsStorage[31] = 0b00001111; // Set some flags in last byte

const flags = StorageValue(flagsStorage);

const checkFlag = (storage: Uint8Array, flagIndex: number): boolean => {
	const byteIndex = Math.floor(flagIndex / 8);
	const bitIndex = flagIndex % 8;
	return (storage[byteIndex] & (1 << (7 - bitIndex))) !== 0;
};
