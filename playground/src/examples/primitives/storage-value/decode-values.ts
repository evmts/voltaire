import { StorageValue } from "@tevm/voltaire";

// Example: Decoding storage values into different types

// Raw storage value from chain
const rawStorage = StorageValue(
	"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000",
);

// Decode as uint256
const asUint256 = StorageValue.toUint256(rawStorage);

// Decode as token amount (18 decimals)
const asTokens = Number(asUint256) / 1e18;

// Decode as boolean (0 = false, non-zero = true)
const decodeAsBool = (storage: StorageValue.StorageValueType): boolean => {
	return StorageValue.toUint256(storage) !== 0n;
};

// Decode address from storage (right-aligned 20 bytes)
const addressStorage = StorageValue(
	"0x000000000000000000000000742d35Cc6634C0532925a3b844Bc454e4438f44e",
);

const decodeAddress = (storage: StorageValue.StorageValueType): string => {
	const bytes = storage.slice(12, 32); // Last 20 bytes
	return `0x${Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
};

// Decode bytes32 (already 32 bytes)
const bytes32Storage = StorageValue(
	"0xdeadbeefcafebabedeadbeefcafebabedeadbeefcafebabedeadbeefcafebabe",
);

// Decode timestamp (uint256 as Unix timestamp)
const timestampStorage = StorageValue(1700000000n);

const decodeTimestamp = (storage: StorageValue.StorageValueType): Date => {
	const unixSeconds = Number(StorageValue.toUint256(storage));
	return new Date(unixSeconds * 1000);
};

// Decode packed uint128 values
const packedStorage = StorageValue(
	"0x00000000000000000000000000000001000000000000000000000000000000ff",
);

const decodeUint128Pair = (
	storage: StorageValue.StorageValueType,
): [bigint, bigint] => {
	let high = 0n;
	let low = 0n;

	for (let i = 0; i < 16; i++) {
		high = (high << 8n) | BigInt(storage[i]);
	}
	for (let i = 16; i < 32; i++) {
		low = (low << 8n) | BigInt(storage[i]);
	}

	return [high, low];
};
const [high, low] = decodeUint128Pair(packedStorage);

// Decode string length (for dynamic strings)
const stringLengthStorage = StorageValue(64n); // String is 64 bytes

// Decode enum value (stored as uint8 in uint256)
const enumStorage = StorageValue(2n); // Enum variant 2

const decodeEnum = (storage: StorageValue.StorageValueType): number => {
	return Number(StorageValue.toUint256(storage));
};

// Decode bit flags from storage
const flagsStorage = StorageValue(0b1101n); // Binary flags

const decodeBitFlags = (storage: StorageValue.StorageValueType): boolean[] => {
	const value = StorageValue.toUint256(storage);
	const flags: boolean[] = [];

	for (let i = 0; i < 8; i++) {
		flags.push((value & (1n << BigInt(i))) !== 0n);
	}

	return flags;
};

// Decode fixed-point decimal (e.g., price with 8 decimals)
const priceStorage = StorageValue(123456789n); // $1.23456789

const decodeFixedPoint = (
	storage: StorageValue.StorageValueType,
	decimals: number,
): string => {
	const value = StorageValue.toUint256(storage);
	const divisor = 10 ** decimals;
	return (Number(value) / divisor).toFixed(decimals);
};

// Decode percentage (stored as basis points: 10000 = 100%)
const percentageStorage = StorageValue(2500n); // 25%

const decodePercentage = (storage: StorageValue.StorageValueType): string => {
	const bps = Number(StorageValue.toUint256(storage));
	return `${bps / 100}%`;
};
