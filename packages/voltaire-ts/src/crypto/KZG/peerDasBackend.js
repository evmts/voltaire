// @ts-nocheck
import * as wasm from "../../wasm-loader/loader.js";
import { KzgNotSupportedError } from "./errors.js";

/**
 * Resolve a PeerDAS function from the WASM loader at call time.
 *
 * The loader does not export the EIP-7594 cell functions yet. Once it exports
 * a function under `name`, the default KZG API picks it up with no change
 * here. Until then every call throws KzgNotSupportedError.
 *
 * @param {string} name - Loader export, e.g. `kzgComputeCells`
 * @returns {(...args: unknown[]) => any}
 */
export function wasmPeerDas(name) {
	return (...args) => {
		// biome-ignore lint/performance/noDynamicNamespaceImportAccess: probing for exports the loader may not have yet
		const fn = wasm[name];
		if (typeof fn !== "function") {
			throw new KzgNotSupportedError(
				`EIP-7594 PeerDAS is not available in the built-in WASM backend (missing ${name}). Inject a backend such as c-kzg through the KZG factory functions.`,
				{ context: { missing: name } },
			);
		}
		return fn(...args);
	};
}
