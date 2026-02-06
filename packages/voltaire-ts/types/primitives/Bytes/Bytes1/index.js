import { clone } from "./clone.js";
import { compare } from "./compare.js";
import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { fromNumber } from "./fromNumber.js";
import { size } from "./size.js";
import { toBytes } from "./toBytes.js";
import { toHex } from "./toHex.js";
import { toNumber } from "./toNumber.js";
// Export individual functions
export { from, fromHex, fromNumber, toHex, toNumber, toBytes, equals, compare, size, clone, };
// Callable constructor
export function Bytes1(value) {
    if (Array.isArray(value)) {
        return from(new Uint8Array(value));
    }
    return from(value);
}
// Static methods
Bytes1.from = from;
Bytes1.fromHex = fromHex;
Bytes1.fromNumber = fromNumber;
Bytes1.toHex = toHex;
Bytes1.toNumber = toNumber;
Bytes1.toBytes = toBytes;
Bytes1.equals = equals;
Bytes1.compare = compare;
Bytes1.size = size;
Bytes1.clone = clone;
