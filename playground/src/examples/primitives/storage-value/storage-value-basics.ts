import { StorageValue, Bytes, Bytes32 } from "@tevm/voltaire";

// Example: StorageValue basics - 32-byte EVM storage slot values

// Create from bigint
const val1 = StorageValue(123n);

// Create from hex string
const val2 = StorageValue(
	"0x0000000000000000000000000000000000000000000000000000000000000456",
);

// Create from Uint8Array
const bytes = Bytes32.zero();
bytes[31] = 0xff; // Last byte = 255
const val3 = StorageValue(bytes);

// Zero value (uninitialized storage slot)
const zero = StorageValue(0n);

// Maximum uint256 value
const maxUint256 = 2n ** 256n - 1n;
const maxVal = StorageValue(maxUint256);

// Comparison operations
const val4 = StorageValue(123n);
const val5 = StorageValue(123n);
const val6 = StorageValue(456n);

// Round-trip conversion
const original = 0xdeadbeefcafebabean;
const roundTrip = StorageValue(original);
const recovered = StorageValue.toUint256(roundTrip);

// Using fromHex method
const val7 = StorageValue.fromHex(
	"0x0000000000000000000000000000000000000000000000000000000000000789",
);
