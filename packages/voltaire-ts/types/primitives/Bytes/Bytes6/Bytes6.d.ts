/**
 * @typedef {import('./Bytes6Type.js').Bytes6Type} Bytes6Type
 */
/**
 * Create Bytes6 from various input types (callable constructor)
 *
 * @param {Uint8Array | string | number[]} value - Input value
 * @returns {Bytes6Type}
 */
export function Bytes6(value: Uint8Array | string | number[]): Bytes6Type;
export namespace Bytes6 {
    export { from };
    export { fromHex };
    export { toHex };
    export { toBytes };
    export { equals };
    export { compare };
    export { size };
    export { clone };
}
export type Bytes6Type = import("./Bytes6Type.js").Bytes6Type;
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { toHex } from "./toHex.js";
import { toBytes } from "./toBytes.js";
import { equals } from "./equals.js";
import { compare } from "./compare.js";
import { size } from "./size.js";
import { clone } from "./clone.js";
//# sourceMappingURL=Bytes6.d.ts.map