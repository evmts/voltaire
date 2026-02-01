/**
 * @typedef {import('./Bytes3Type.js').Bytes3Type} Bytes3Type
 */
/**
 * Create Bytes3 from various input types (callable constructor)
 *
 * @param {Uint8Array | string | number[]} value - Input value
 * @returns {Bytes3Type}
 */
export function Bytes3(value: Uint8Array | string | number[]): Bytes3Type;
export namespace Bytes3 {
    export { from };
    export { fromHex };
    export { toHex };
    export { toBytes };
    export { equals };
    export { compare };
    export { size };
    export { clone };
}
export type Bytes3Type = import("./Bytes3Type.js").Bytes3Type;
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { toHex } from "./toHex.js";
import { toBytes } from "./toBytes.js";
import { equals } from "./equals.js";
import { compare } from "./compare.js";
import { size } from "./size.js";
import { clone } from "./clone.js";
//# sourceMappingURL=Bytes3.d.ts.map