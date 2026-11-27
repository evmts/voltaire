/**
 * Resolve a PeerDAS function from the WASM loader at call time.
 *
 * The loader does not export the EIP-7594 cell functions yet. Once it exports
 * a function under `name`, the default KZG API picks it up with no change
 * here. Until then every call throws KzgNotSupportedError.
 *
 * @template {(...args: never[]) => unknown} T
 * @param {string} name - Loader export, e.g. `kzgComputeCells`
 * @returns {T}
 */
export function wasmPeerDas<T extends (...args: never[]) => unknown>(name: string): T;
//# sourceMappingURL=peerDasBackend.d.ts.map