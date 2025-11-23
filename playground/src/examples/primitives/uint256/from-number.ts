import * as Uint256 from '../../../../../src/primitives/Uint/index.js';

// Create Uint256 from number
const small = Uint256.fromNumber(42);
console.log('From number 42:', Uint256.toHex(small));

// Create from larger number
const large = Uint256.fromNumber(1000000);
console.log('From number 1000000:', Uint256.toHex(large));

// Zero
const zero = Uint256.fromNumber(0);
console.log('From number 0:', Uint256.toHex(zero));
console.log('Is zero:', Uint256.isZero(zero));

// Max safe integer
const maxSafe = Uint256.fromNumber(Number.MAX_SAFE_INTEGER);
console.log('Max safe integer:', Uint256.toBigInt(maxSafe));
