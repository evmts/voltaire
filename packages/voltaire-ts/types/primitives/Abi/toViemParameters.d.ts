/**
 * @typedef {{
 *   readonly type: string;
 *   readonly name?: string;
 *   readonly components?: readonly ViemAbiParam[];
 * }} ViemAbiParam
 */
/**
 * Factory: convert Voltaire-native decoded ABI parameter values into viem output shape.
 *
 * - `address` -> EIP-55 checksummed string
 * - `bytes` / `bytesN` / `function` -> `0x` lowercase hex string
 * - `uintN` / `intN` with N <= 48 -> JS `number`; wider or bare `uint`/`int` -> `bigint`
 * - `tuple` with all named components -> object keyed by component name
 * - `tuple` with any unnamed component or no components -> array
 * - `bool` / `string` -> unchanged
 *
 * @param {{ keccak256: (data: Uint8Array) => Uint8Array }} deps
 * @returns {(params: readonly ViemAbiParam[], values: readonly unknown[]) => unknown[]}
 */
export function CreateViemParameterConverter({ keccak256 }: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): (params: readonly ViemAbiParam[], values: readonly unknown[]) => unknown[];
export type ViemAbiParam = {
    readonly type: string;
    readonly name?: string;
    readonly components?: readonly ViemAbiParam[];
};
//# sourceMappingURL=toViemParameters.d.ts.map