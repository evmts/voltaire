/**
 * Parse human-readable Solidity ABI signatures into JSON ABI items.
 *
 * Supports `function`, `event`, `error`, `constructor`, `fallback`, `receive`,
 * and `struct` declarations (referenced by name from other signatures).
 * Parameters accept tuples (`(uint256 a, address b)` or `tuple(...)`), arrays
 * (`[]`, `[N]`, nested), `indexed`, data locations (`memory`, `calldata`,
 * `storage`, ignored), and `address payable`. `uint`/`int` normalize to
 * `uint256`/`int256`. Struct declarations produce no ABI item.
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.1.0
 * JSON ABI item objects may be mixed in; they pass through unchanged.
 *
 * @param {readonly (string | import('./Item/ItemType.js').ItemType)[]} signatures - Human-readable signatures and/or JSON ABI items
 * @returns {import('./Item/ItemType.js').ItemType[]} ABI items in input order (structs omitted)
 * @throws {AbiParseError} If a signature is malformed or references an unknown type
 * @example
 * ```javascript
 * import { parseHumanReadable } from './primitives/Abi/parseHumanReadable.js';
 * const items = parseHumanReadable([
 *   'function transfer(address to, uint256 amount) returns (bool)',
 *   'event Transfer(address indexed from, address indexed to, uint256 value)',
 * ]);
 * ```
 */
export function parseHumanReadable(signatures: readonly (string | import("./Item/ItemType.js").ItemType)[]): import("./Item/ItemType.js").ItemType[];
export type Param = {
    type: string;
    name?: string;
    indexed?: boolean;
    components?: Param[];
};
export type StructSources = Map<string, string>;
//# sourceMappingURL=parseHumanReadable.d.ts.map