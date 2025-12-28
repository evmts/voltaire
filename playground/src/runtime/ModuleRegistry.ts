/**
 * Dynamic module registry using Vite's import.meta.glob
 * Auto-discovers all voltaire modules at build time
 */

// Use import.meta.glob to discover modules at build time
// These are eagerly loaded so they're available synchronously at runtime
const primitiveModules = import.meta.glob("../../../src/primitives/*/index.{ts,js}", {
	eager: true,
});
const cryptoModules = import.meta.glob("../../../src/crypto/*/index.{ts,js}", {
	eager: true,
});
const evmModules = import.meta.glob("../../../src/evm/*/index.{ts,js}", {
	eager: true,
});
// WASM aggregate entry + loader
const wasmAggregate = import.meta.glob("../../../src/wasm/index.{ts,js}", {
  eager: true,
});
const wasmLoader = import.meta.glob("../../../src/wasm-loader/loader.{ts,js}", {
  eager: true,
});

export interface ModuleEntry {
	specifier: string;
	module: unknown;
	exports: string[];
}

/**
 * Extract module name from glob path
 * e.g., "../../src/primitives/Address/index.ts" -> "Address"
 * e.g., "../../src/crypto/Secp256k1/index.js" -> "Secp256k1"
 */
function extractModuleName(path: string): string | null {
	const match = path.match(/\/([^/]+)\/index\.(ts|js)$/);
	return match ? match[1] : null;
}

/**
 * Build the module registry from glob results
 */
function buildRegistry(): Map<string, ModuleEntry> {
	const registry = new Map<string, ModuleEntry>();

	// Register primitives
	for (const [path, mod] of Object.entries(primitiveModules)) {
		const name = extractModuleName(path);
		if (name) {
			const specifier = `voltaire/primitives/${name}`;
			registry.set(specifier, {
				specifier,
				module: mod,
				exports: Object.keys(mod as object),
			});
		}
	}

	// Register crypto
	for (const [path, mod] of Object.entries(cryptoModules)) {
		const name = extractModuleName(path);
		if (name) {
			const specifier = `voltaire/crypto/${name}`;
			registry.set(specifier, {
				specifier,
				module: mod,
				exports: Object.keys(mod as object),
			});
		}
	}

	// Register evm
	for (const [path, mod] of Object.entries(evmModules)) {
		const name = extractModuleName(path);
		if (name) {
			const specifier = `voltaire/evm/${name}`;
			registry.set(specifier, {
				specifier,
				module: mod,
				exports: Object.keys(mod as object),
			});
		}
	}

	// Register wasm aggregate API under a stable specifier
	for (const [, mod] of Object.entries(wasmAggregate)) {
		const specifier = "voltaire/wasm";
		registry.set(specifier, {
			specifier,
			module: mod,
			exports: Object.keys(mod as object),
		});
	}

	// Register wasm-loader so examples can initialize WASM
	for (const [, mod] of Object.entries(wasmLoader)) {
		const specifier = "voltaire/wasm-loader/loader";
		registry.set(specifier, {
			specifier,
			module: mod,
			exports: Object.keys(mod as object),
		});
	}

	return registry;
}

// Build registry once at module load time
export const moduleRegistry = buildRegistry();

// Log discovered modules for debugging
if (moduleRegistry.size === 0) {
	console.warn("[ModuleRegistry] No voltaire modules discovered. Check glob paths.");
} else {
	console.log(`[ModuleRegistry] Discovered ${moduleRegistry.size} voltaire modules`);
}

/**
 * Get a module by its specifier
 */
export function getModule(specifier: string): unknown | undefined {
	return moduleRegistry.get(specifier)?.module;
}

/**
 * Check if a module exists in the registry
 */
export function hasModule(specifier: string): boolean {
	return moduleRegistry.has(specifier);
}

/**
 * Get all available module specifiers
 */
export function getAllSpecifiers(): string[] {
	return Array.from(moduleRegistry.keys()).sort();
}

/**
 * Get module entry with full info
 */
export function getModuleEntry(specifier: string): ModuleEntry | undefined {
	return moduleRegistry.get(specifier);
}

/**
 * Find modules matching a partial name (for suggestions)
 */
export function findSimilarModules(partial: string): string[] {
	const lower = partial.toLowerCase();
	const lastPart = lower.split("/").pop() || "";

	return getAllSpecifiers()
		.filter((spec) => spec.toLowerCase().includes(lastPart))
		.slice(0, 5);
}
