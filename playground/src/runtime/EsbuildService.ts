/**
 * Singleton service for esbuild-wasm initialization
 * Handles lazy loading and caching of the WASM module
 */
import * as esbuild from "esbuild-wasm";

let initialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Initialize esbuild-wasm (call once, cached thereafter)
 */
export async function initEsbuild(): Promise<void> {
	if (initialized) return;
	if (initPromise) return initPromise;

	initPromise = esbuild.initialize({
		wasmURL: "/esbuild.wasm",
		worker: true, // Run in web worker for non-blocking UI
	});

	await initPromise;
	initialized = true;
}

/**
 * Preload esbuild in background (call after initial render)
 */
export function preloadEsbuild(): void {
	if (!initPromise && typeof requestIdleCallback !== "undefined") {
		requestIdleCallback(() => {
			initEsbuild().catch((_err) => {});
		});
	} else if (!initPromise) {
		// Fallback for browsers without requestIdleCallback
		setTimeout(() => {
			initEsbuild().catch((_err) => {});
		}, 100);
	}
}

/**
 * Check if esbuild is ready
 */
export function isEsbuildReady(): boolean {
	return initialized;
}

// Re-export esbuild for use in other modules
export { esbuild };
