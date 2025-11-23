import * as Uint256 from '../../../../../src/primitives/Uint/index.js';

// Convert to hex
const value = Uint256.fromNumber(255);
const hex = Uint256.toHex(value);
console.log('255 as hex:', hex);

// Large number to hex
const large = Uint256.fromBigInt(123456789012345678901234567890n);
console.log('Large number as hex:', Uint256.toHex(large));

// Zero to hex
const zero = Uint256.ZERO;
console.log('Zero as hex:', Uint256.toHex(zero));

// Max value to hex
const max = Uint256.MAX;
console.log('Max as hex:', Uint256.toHex(max));

// Padded hex output
const small = Uint256.fromNumber(1);
console.log('Unpadded hex:', Uint256.toHex(small));
console.log('Padded hex (32 bytes):', Uint256.toHex(small, true));

// Roundtrip conversion
const original = '0x123456';
const uint = Uint256.fromHex(original);
const converted = Uint256.toHex(uint);
console.log('Roundtrip preserves value:', original === converted);
