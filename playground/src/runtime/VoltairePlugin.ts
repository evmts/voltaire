/**
 * esbuild plugin for resolving voltaire/* imports
 * Maps imports to the pre-loaded module registry
 */
import type { Plugin } from "esbuild-wasm";
import { findSimilarModules, getAllSpecifiers, hasModule } from "./ModuleRegistry.js";

const VOLTAIRE_NAMESPACE = "voltaire-virtual";

/**
 * Create the voltaire resolver plugin for esbuild
 */
export function voltairePlugin(): Plugin {
	return {
		name: "voltaire-resolver",
		setup(build) {
			// Resolve voltaire/* imports to virtual namespace
			build.onResolve({ filter: /^voltaire\// }, (args) => {
				const specifier = args.path;

				// Validate module exists
				if (!hasModule(specifier)) {
					const similar = findSimilarModules(specifier);
					const suggestion =
						similar.length > 0
							? `\nDid you mean: ${similar.join(", ")}?`
							: `\nAvailable modules include:\n  ${getAllSpecifiers().slice(0, 10).join("\n  ")}...`;

					return {
						errors: [
							{
								text: `Module "${specifier}" not found.${suggestion}`,
								location: {
									file: args.importer || "playground.ts",
									namespace: "file",
								},
							},
						],
					};
				}

				return {
					path: specifier,
					namespace: VOLTAIRE_NAMESPACE,
				};
			});

			// Load virtual modules - return stub that references runtime registry
			build.onLoad({ filter: /.*/, namespace: VOLTAIRE_NAMESPACE }, (args) => {
				const specifier = args.path;

				// Generate CommonJS module that pulls from the injected global
				// This allows the bundled code to access pre-loaded modules at runtime
				const contents = `module.exports = globalThis.__VOLTAIRE_MODULES__["${specifier}"];`;

				return {
					contents,
					loader: "js",
				};
			});
		},
	};
}
