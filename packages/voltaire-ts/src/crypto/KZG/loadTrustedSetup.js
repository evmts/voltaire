import {
	ensureWasmLoaded,
	kzgFreeTrustedSetup as wasmFreeTrustedSetup,
	kzgIsInitialized as wasmIsInitialized,
	kzgLoadTrustedSetup as wasmLoadTrustedSetup,
	kzgLoadTrustedSetupBytes as wasmLoadTrustedSetupBytes,
} from "../../wasm-loader/loader.js";
import { KzgError } from "./errors.js";

/**
 * Resolve `node:fs` dynamically without a static Node import so browser
 * bundlers stay clean.
 *
 * @returns {{ existsSync: (p: string | URL) => boolean; readFileSync: (p: string | URL) => Uint8Array } | null}
 */
function getNodeFs() {
	const proc =
		/** @type {{ getBuiltinModule?: (id: string) => unknown } | undefined} */ (
			typeof process !== "undefined" ? process : undefined
		);
	if (typeof proc?.getBuiltinModule !== "function") return null;
	const mod = proc.getBuiltinModule("node:fs");
	if (
		mod &&
		typeof mod === "object" &&
		"existsSync" in mod &&
		"readFileSync" in mod
	) {
		return /** @type {{ existsSync: (p: string | URL) => boolean; readFileSync: (p: string | URL) => Uint8Array }} */ (
			mod
		);
	}
	return null;
}

/**
 * Lazily read `trusted_setup.txt` bytes on Node/Bun without embedding 788 KB
 * inside `primitives.wasm`.
 *
 * @param {string} [filePath]
 * @returns {Uint8Array | null}
 */
function readDefaultTrustedSetupBytes(filePath) {
	const fs = getNodeFs();
	if (!fs) return null;
	if (filePath) {
		const raw = fs.readFileSync(filePath);
		return new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength);
	}
	const candidates = [
		new URL("../../wasm/kzg-trusted-setup.txt", import.meta.url),
		new URL("../wasm/kzg-trusted-setup.txt", import.meta.url),
		new URL(
			"../../../../voltaire-zig/lib/c-kzg-4844/src/trusted_setup.txt",
			import.meta.url,
		),
	];
	for (const candidate of candidates) {
		if (fs.existsSync(candidate)) {
			const raw = fs.readFileSync(candidate);
			return new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength);
		}
	}
	return null;
}

/**
 * Load trusted setup for KZG operations.
 *
 * Call this once during application startup before using any KZG operations.
 * In Node/Bun, loads the standalone `trusted_setup.txt` file lazily on demand
 * without embedding 788 KB into `primitives.wasm`. In browsers, pass the raw
 * `trusted_setup.txt` `Uint8Array` bytes directly.
 *
 * @see https://voltaire.tevm.sh/crypto/kzg
 * @since 0.0.0
 * @param {string | Uint8Array} [filePathOrBytes] - Optional path to `trusted_setup.txt` (Node/Bun) or raw UTF-8 setup bytes (browser/edge)
 * @returns {void}
 * @throws {KzgError} If loading fails
 */
export function loadTrustedSetup(filePathOrBytes) {
	try {
		ensureWasmLoaded();
		if (filePathOrBytes instanceof Uint8Array) {
			wasmLoadTrustedSetupBytes(filePathOrBytes);
			return;
		}
		if (typeof filePathOrBytes === "string") {
			const bytes = readDefaultTrustedSetupBytes(filePathOrBytes);
			if (!bytes) {
				throw new Error(
					"Reading KZG trusted setup from a file path requires Node/Bun; pass Uint8Array bytes in browser runtimes.",
				);
			}
			wasmLoadTrustedSetupBytes(bytes);
			return;
		}
		try {
			wasmLoadTrustedSetup();
		} catch (embeddedError) {
			const bytes = readDefaultTrustedSetupBytes();
			if (bytes) {
				wasmLoadTrustedSetupBytes(bytes);
				return;
			}
			throw embeddedError;
		}
	} catch (error) {
		throw new KzgError(
			`Failed to load KZG trusted setup: ${error instanceof Error ? error.message : String(error)}`,
			{
				code: -32000,
				context: { environment: "wasm" },
				docsPath: "/crypto/kzg#error-handling",
				cause: error instanceof Error ? error : undefined,
			},
		);
	}
}

/**
 * Free trusted setup resources
 *
 * Call when KZG operations are no longer needed.
 *
 * @see https://voltaire.tevm.sh/crypto/kzg
 * @since 0.0.0
 * @returns {void}
 */
export function freeTrustedSetup() {
	wasmFreeTrustedSetup();
}

/**
 * Get initialization state (internal)
 * @internal
 */
export function getInitialized() {
	return wasmIsInitialized();
}

/**
 * Set initialization state (internal)
 * @internal
 * @param {boolean} _value - Ignored (managed by WASM layer)
 */
export function setInitialized(_value) {
	// No-op: initialization state is managed by WASM layer
}
