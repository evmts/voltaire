/**
 * @typedef {import('./Bytes7Type.js').Bytes7Type} Bytes7Type
 */
/**
 * Create Bytes7 from various input types (callable constructor)
 *
 * @param {Uint8Array | string | number[]} value - Input value
 * @returns {Bytes7Type}
 */
export function Bytes7(value: Uint8Array | string | number[]): Bytes7Type;
export namespace Bytes7 {
    export { from };
    export { fromHex };
    export { toHex };
    export { toBytes };
    export { equals };
    export { compare };
    export { size };
    export { clone };
}
export type Bytes7Type = import("./Bytes7Type.js").Bytes7Type;
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { toHex } from "./toHex.js";
import { toBytes } from "./toBytes.js";
import { equals } from "./equals.js";
import { compare } from "./compare.js";
import { size } from "./size.js";
import { clone } from "./clone.js";
//# sourceMappingURL=Bytes7.d.ts.map