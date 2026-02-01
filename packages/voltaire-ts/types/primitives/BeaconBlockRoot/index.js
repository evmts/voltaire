export { SIZE } from "./BeaconBlockRootType.js";
import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
import { toHex } from "./toHex.js";
export { from, fromHex, fromBytes, toHex, equals };
export const BeaconBlockRoot = {
    from,
    fromHex,
    fromBytes,
    toHex,
    equals,
};
