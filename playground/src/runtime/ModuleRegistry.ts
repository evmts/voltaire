/**
 * Dynamic module registry using Vite's import.meta.glob
 * Registers "voltaire" and "voltaire/wasm" as main entry points
 */

// Root voltaire entry (primitives + crypto)
const rootEntry = import.meta.glob("../../../src/index.{ts,js}", {
	eager: true,
});

// WASM aggregate entry
const wasmEntry = import.meta.glob("../../../src/wasm/index.{ts,js}", {
	eager: true,
});

export interface ModuleEntry {
	specifier: string;
	module: unknown;
	exports: string[];
}

/**
 * Build the module registry from glob results
 */
function buildRegistry(): Map<string, ModuleEntry> {
	const registry = new Map<string, ModuleEntry>();

	// Register root "voltaire" entry
	for (const [, mod] of Object.entries(rootEntry)) {
		registry.set("voltaire", {
			specifier: "voltaire",
			module: mod,
			exports: Object.keys(mod as object),
		});
	}

	// Register "voltaire/wasm" entry
	for (const [, mod] of Object.entries(wasmEntry)) {
		registry.set("voltaire/wasm", {
			specifier: "voltaire/wasm",
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
	console.warn(
		"[ModuleRegistry] No voltaire modules discovered. Check glob paths.",
	);
} else {
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
	return getAllSpecifiers()
		.filter((spec) => spec.toLowerCase().includes(lower))
		.slice(0, 5);
}
