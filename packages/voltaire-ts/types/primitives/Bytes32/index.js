/**
 * Bytes32 - Fixed-size 32-byte array type
 *
 * Generic 32-byte data structure used throughout Ethereum for various purposes
 * including storage values, contract data, and numeric representations.
 *
 * @module
 */
// Constants
export { SIZE, ZERO } from "./constants.js";
// Error exports
export * from "./errors.js";
// Import individual functions
import { bitwiseAnd } from "./bitwiseAnd.js";
import { bitwiseOr } from "./bitwiseOr.js";
import { bitwiseXor } from "./bitwiseXor.js";
import { clone } from "./clone.js";
import { compare } from "./compare.js";
import { SIZE, ZERO } from "./constants.js";
import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromBigint } from "./fromBigint.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
import { fromNumber } from "./fromNumber.js";
import { isZero } from "./isZero.js";
import { max } from "./max.js";
import { min } from "./min.js";
import { toBigint } from "./toBigint.js";
import { toHex } from "./toHex.js";
import { toNumber } from "./toNumber.js";
import { zero } from "./zero.js";
// Export individual functions for tree-shaking
export { 
// Constructors
from, fromBytes, fromHex, fromNumber, fromBigint, 
// Converters
toHex, toNumber, toBigint, 
// Comparison
equals, compare, isZero, 
// Utilities
clone, zero, 
// Bitwise operations
bitwiseAnd, bitwiseOr, bitwiseXor, 
// Min/Max
min, max, };
export { bitwiseAnd as _bitwiseAnd } from "./bitwiseAnd.js";
export { bitwiseOr as _bitwiseOr } from "./bitwiseOr.js";
export { bitwiseXor as _bitwiseXor } from "./bitwiseXor.js";
export { clone as _clone } from "./clone.js";
export { compare as _compare } from "./compare.js";
export { equals as _equals } from "./equals.js";
// Internal exports (prefixed with _ for advanced usage)
export { from as _from } from "./from.js";
export { fromBigint as _fromBigint } from "./fromBigint.js";
export { fromBytes as _fromBytes } from "./fromBytes.js";
export { fromHex as _fromHex } from "./fromHex.js";
export { fromNumber as _fromNumber } from "./fromNumber.js";
export { isZero as _isZero } from "./isZero.js";
export { max as _max } from "./max.js";
export { min as _min } from "./min.js";
export { toBigint as _toBigint } from "./toBigint.js";
export { toHex as _toHex } from "./toHex.js";
export { toNumber as _toNumber } from "./toNumber.js";
export { zero as _zero } from "./zero.js";
// Namespace export for convenient grouped access
export const Bytes32 = {
    // Constructors
    from,
    fromBytes,
    fromHex,
    fromNumber,
    fromBigint,
    // Converters
    toHex,
    toNumber,
    toBigint,
    // Comparison
    equals,
    compare,
    isZero,
    // Utilities
    clone,
    zero,
    // Bitwise operations
    bitwiseAnd,
    bitwiseOr,
    bitwiseXor,
    // Min/Max
    min,
    max,
    // Constants
    SIZE,
    ZERO,
};
// Default export
export default Bytes32;
