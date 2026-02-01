/**
 * @typedef {import('./Bytes5Type.js').Bytes5Type} Bytes5Type
 */
/**
 * Create Bytes5 from various input types (callable constructor)
 *
 * @param {Uint8Array | string | number[]} value - Input value
 * @returns {Bytes5Type}
 */
export function Bytes5(value: Uint8Array | string | number[]): Bytes5Type;
export namespace Bytes5 {
    export { from };
    export { fromHex };
    export { toHex };
    export { toBytes };
    export { equals };
    export { compare };
    export { size };
    export { clone };
}
export type Bytes5Type = import("./Bytes5Type.js").Bytes5Type;
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { toHex } from "./toHex.js";
import { toBytes } from "./toBytes.js";
import { equals } from "./equals.js";
import { compare } from "./compare.js";
import { size } from "./size.js";
import { clone } from "./clone.js";
//# sourceMappingURL=Bytes5.d.ts.map