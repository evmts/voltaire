/**
 * Dynamic module registry for the in-browser playground executor.
 * Registers the root `@tevm/voltaire` (Pure TS), `@tevm/voltaire/wasm` (Zig WASM),
 * and subpath exports derived from the live Voltaire source modules.
 */

import * as voltaireRoot from "../../../../packages/voltaire-ts/src/index.ts";
import * as voltaireWasm from "../../../../packages/voltaire-ts/src/wasm/index.ts";

export interface ModuleEntry {
	specifier: string;
	module: unknown;
	exports: string[];
}

/**
 * Build the module registry from the live Voltaire entrypoints.
 */
function buildRegistry(): Map<string, ModuleEntry> {
	const registry = new Map<string, ModuleEntry>();

	const rootExports = Object.keys(voltaireRoot);
	registry.set("voltaire", {
		specifier: "voltaire",
		module: voltaireRoot,
		exports: rootExports,
	});

	const wasmExports = Object.keys(voltaireWasm);
	registry.set("voltaire/wasm", {
		specifier: "voltaire/wasm",
		module: voltaireWasm,
		exports: wasmExports,
	});

	// Expose top-level named namespaces as subpath specifiers (e.g. voltaire/Address, voltaire/Keccak256)
	for (const key of rootExports) {
		if (key === "wasm" || key === "default") continue;
		const value = (voltaireRoot as Record<string, unknown>)[key];
		if (value !== null && (typeof value === "object" || typeof value === "function")) {
			const subpath = `voltaire/${key}`;
			if (!registry.has(subpath)) {
				const subModule = {
					[key]: value,
					...(typeof value === "object" ? (value as Record<string, unknown>) : {}),
					default: value,
				};
				registry.set(subpath, {
					specifier: subpath,
					module: subModule,
					exports: Object.keys(subModule),
				});
			}
		}
	}

	return registry;
}

// Build registry once at module load time
export const moduleRegistry = buildRegistry();

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
