import * as StorageValue from "../../../primitives/StorageValue/index.js";

// Example: StorageValue basics - 32-byte EVM storage slot values

// Create from bigint
const val1 = StorageValue.from(123n);
console.log("From bigint:", StorageValue.toHex(val1));
console.log("Length:", val1.length, "bytes");

// Create from hex string
const val2 = StorageValue.from(
	"0x0000000000000000000000000000000000000000000000000000000000000456",
);
console.log("\nFrom hex:", StorageValue.toHex(val2));
console.log("As uint256:", StorageValue.toUint256(val2));

// Create from Uint8Array
const bytes = new Uint8Array(32);
bytes[31] = 0xff; // Last byte = 255
const val3 = StorageValue.from(bytes);
console.log("\nFrom bytes:", StorageValue.toHex(val3));
console.log("As uint256:", StorageValue.toUint256(val3));

// Zero value (uninitialized storage slot)
const zero = StorageValue.from(0n);
console.log("\nZero value:", StorageValue.toHex(zero));
console.log(
	"Is all zeros:",
	zero.every((b) => b === 0),
);

// Maximum uint256 value
const maxUint256 = 2n ** 256n - 1n;
const maxVal = StorageValue.from(maxUint256);
console.log("\nMax uint256:", StorageValue.toHex(maxVal));
console.log(
	"Is all 0xff:",
	maxVal.every((b) => b === 0xff),
);

// Comparison operations
const val4 = StorageValue.from(123n);
const val5 = StorageValue.from(123n);
const val6 = StorageValue.from(456n);

console.log("\nEquals 123 vs 123:", StorageValue.equals(val4, val5));
console.log("Equals 123 vs 456:", StorageValue.equals(val4, val6));

// Round-trip conversion
const original = 0xdeadbeefcafebabean;
const roundTrip = StorageValue.from(original);
const recovered = StorageValue.toUint256(roundTrip);
console.log("\nRound-trip test:");
console.log("Original:", original.toString(16));
console.log("Recovered:", recovered.toString(16));
console.log("Match:", original === recovered);

// Using fromHex method
const val7 = StorageValue.fromHex(
	"0x0000000000000000000000000000000000000000000000000000000000000789",
);
console.log("\nFromHex method:", StorageValue.toHex(val7));
console.log("As uint256:", StorageValue.toUint256(val7));
