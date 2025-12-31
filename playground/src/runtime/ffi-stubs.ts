/**
 * Browser stubs for FFI/native modules
 * These modules require native binaries that can't run in the browser
 */

// Stub for lib-path.js
export const LIB_PATH = "";

// Stub for ref-napi
export const refType = () => ({});
export const types = {
	void: {},
	int: {},
	size_t: {},
	pointer: {},
};

// Stub for ffi-napi
export function Library(): Record<string, () => never> {
	return new Proxy(
		{},
		{
			get: () => () => {
				throw new Error(
					"FFI is not available in browser. Use WASM implementation.",
				);
			},
		},
	);
}

// Default export for ffi-napi
export default {
	Library,
};
