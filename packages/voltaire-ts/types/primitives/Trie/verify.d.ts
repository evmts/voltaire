/**
 * @typedef {{ keccak256: (data: Uint8Array) => Uint8Array; rlpDecode: (bytes: Uint8Array, stream?: boolean) => any }} VerifyDeps
 */
/**
 * Factory: create a verify function with injected crypto.
 *
 * @param {VerifyDeps} deps
 * @returns {(rootHash: Uint8Array, key: Uint8Array, proof: ReadonlyArray<Uint8Array>) => { value: Uint8Array | null; valid: boolean }}
 */
export function Verify(deps: VerifyDeps): (rootHash: Uint8Array, key: Uint8Array, proof: ReadonlyArray<Uint8Array>) => {
    value: Uint8Array | null;
    valid: boolean;
};
export type VerifyDeps = {
    keccak256: (data: Uint8Array) => Uint8Array;
    rlpDecode: (bytes: Uint8Array, stream?: boolean) => any;
};
//# sourceMappingURL=verify.d.ts.map