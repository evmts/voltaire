import * as Uint256 from "../../../../../src/primitives/Uint/index.js";

// Create Uint256 from bigint
const value = Uint256.fromBigInt(42n);
console.log("From 42n:", Uint256.toBigInt(value));

// Create from large bigint
const large = Uint256.fromBigInt(10n ** 18n); // 1 ETH in wei
console.log("1 ETH in wei:", Uint256.toString(large));

// Max value
const max = Uint256.fromBigInt(2n ** 256n - 1n);
console.log("Max value equals MAX constant:", Uint256.equals(max, Uint256.MAX));

// Conversion roundtrip
const original = 123456789n;
const uint = Uint256.fromBigInt(original);
const converted = Uint256.toBigInt(uint);
console.log("Roundtrip preserves value:", original === converted);
