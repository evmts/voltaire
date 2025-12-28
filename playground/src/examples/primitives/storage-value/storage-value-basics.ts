import { StorageValue } from "voltaire";

// Example: StorageValue basics - 32-byte EVM storage slot values

// Create from bigint
const val1 = StorageValue.from(123n);

// Create from hex string
const val2 = StorageValue.from(
	"0x0000000000000000000000000000000000000000000000000000000000000456",
);

// Create from Uint8Array
const bytes = new Uint8Array(32);
bytes[31] = 0xff; // Last byte = 255
const val3 = StorageValue.from(bytes);

// Zero value (uninitialized storage slot)
const zero = StorageValue.from(0n);

// Maximum uint256 value
const maxUint256 = 2n ** 256n - 1n;
const maxVal = StorageValue.from(maxUint256);

// Comparison operations
const val4 = StorageValue.from(123n);
const val5 = StorageValue.from(123n);
const val6 = StorageValue.from(456n);

// Round-trip conversion
const original = 0xdeadbeefcafebabean;
const roundTrip = StorageValue.from(original);
const recovered = StorageValue.toUint256(roundTrip);

// Using fromHex method
const val7 = StorageValue.fromHex(
	"0x0000000000000000000000000000000000000000000000000000000000000789",
);
