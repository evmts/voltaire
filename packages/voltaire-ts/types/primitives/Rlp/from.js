import { RlpEncodingError } from "./errors.js";
import { isData } from "./isData.js";
/**
 * Create RLP data from various inputs
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {Uint8Array | import('./RlpType.js').BrandedRlp | import('./RlpType.js').BrandedRlp[]} value - Uint8Array (bytes), RlpData, or array (list)
 * @returns {import('./RlpType.js').BrandedRlp} RLP data structure
 * @throws {RlpEncodingError} If input type is invalid
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * const rlp = Rlp.from(new Uint8Array([1, 2, 3]));
 * // => { type: 'bytes', value: Uint8Array([1, 2, 3]) }
 * const rlp2 = Rlp.from([{ type: 'bytes', value: new Uint8Array([1]) }]);
 * // => { type: 'list', value: [...] }
 * ```
 */
export function from(value) {
    if (value instanceof Uint8Array) {
        return { type: "bytes", value };
    }
    if (isData(value)) {
        return value;
    }
    if (Array.isArray(value)) {
        return { type: "list", value };
    }
    throw new RlpEncodingError("Invalid input for Rlp.from", {
        code: "RLP_INVALID_TYPE",
        context: { type: typeof value },
    });
}
