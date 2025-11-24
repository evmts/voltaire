import * as Uint256 from "../../../../../src/primitives/Uint/index.js";

// Convert to bigint
const value = Uint256.fromNumber(42);
const bigint = Uint256.toBigInt(value);

// Large number conversion
const large = Uint256.fromHex("0xffffffffffffffffffffffffffffffff");
const largeBigInt = Uint256.toBigInt(large);

// Use bigint for native operations
const uint1 = Uint256.fromNumber(100);
const uint2 = Uint256.fromNumber(200);
const sum = Uint256.toBigInt(uint1) + Uint256.toBigInt(uint2);

// Convert back from bigint
const converted = Uint256.fromBigInt(sum);

// MAX constant
const maxBigInt = Uint256.toBigInt(Uint256.MAX);
