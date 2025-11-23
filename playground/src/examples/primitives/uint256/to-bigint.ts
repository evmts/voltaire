import * as Uint256 from '../../../../../src/primitives/Uint/index.js';

// Convert to bigint
const value = Uint256.fromNumber(42);
const bigint = Uint256.toBigInt(value);
console.log('To bigint:', bigint);
console.log('Type:', typeof bigint);

// Large number conversion
const large = Uint256.fromHex('0xffffffffffffffffffffffffffffffff');
const largeBigInt = Uint256.toBigInt(large);
console.log('Large hex to bigint:', largeBigInt);

// Use bigint for native operations
const uint1 = Uint256.fromNumber(100);
const uint2 = Uint256.fromNumber(200);
const sum = Uint256.toBigInt(uint1) + Uint256.toBigInt(uint2);
console.log('Native bigint addition:', sum);

// Convert back from bigint
const converted = Uint256.fromBigInt(sum);
console.log('Convert back:', Uint256.toNumber(converted));

// MAX constant
const maxBigInt = Uint256.toBigInt(Uint256.MAX);
console.log('MAX as bigint:', maxBigInt);
console.log('Equals 2^256-1:', maxBigInt === 2n ** 256n - 1n);
