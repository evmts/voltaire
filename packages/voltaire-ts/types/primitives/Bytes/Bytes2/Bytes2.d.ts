/**
 * @typedef {import('./Bytes2Type.js').Bytes2Type} Bytes2Type
 */
/**
 * Create Bytes2 from various input types (callable constructor)
 *
 * @param {Uint8Array | string | number[]} value - Input value
 * @returns {Bytes2Type}
 */
export function Bytes2(value: Uint8Array | string | number[]): Bytes2Type;
export namespace Bytes2 {
    export { from };
    export { fromHex };
    export { toHex };
    export { toBytes };
    export { equals };
    export { compare };
    export { size };
    export { clone };
}
export type Bytes2Type = import("./Bytes2Type.js").Bytes2Type;
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { toHex } from "./toHex.js";
import { toBytes } from "./toBytes.js";
import { equals } from "./equals.js";
import { compare } from "./compare.js";
import { size } from "./size.js";
import { clone } from "./clone.js";
//# sourceMappingURL=Bytes2.d.ts.map