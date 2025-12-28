// Ensure WASM is available so wasm API calls work synchronously
import { loadWasm } from "../../../src/wasm-loader/loader.js";
/**
 * Executor - Bundles and executes user TypeScript code using esbuild-wasm
 *
 * Flow:
 * 1. Initialize esbuild-wasm (once, cached)
 * 2. Bundle user code with voltairePlugin to resolve imports
 * 3. Inject module registry into globalThis
 * 4. Execute bundled code via Function constructor
 */
import { esbuild, initEsbuild } from "./EsbuildService.js";
import { moduleRegistry } from "./ModuleRegistry.js";
import { voltairePlugin } from "./VoltairePlugin.js";

export interface ExecutionResult {
	success: boolean;
	error?: Error;
	duration: number;
}

export class Executor {
	private initialized = false;

	/**
	 * Initialize the executor (loads esbuild-wasm)
	 */
	async init(): Promise<void> {
		if (this.initialized) return;
		await initEsbuild();
		this.initialized = true;
	}

	/**
	 * Execute user TypeScript code
	 */
	async execute(code: string): Promise<ExecutionResult> {
		const startTime = performance.now();

		try {
			// Ensure esbuild is ready
			await this.init();

			// Preload Voltaire WASM (idempotent)
			try {
				await loadWasm("/wasm/primitives.wasm");
			} catch {
				// WASM may not be available in all environments
			}

			// Bundle user code with esbuild
			const result = await esbuild.build({
				stdin: {
					contents: code,
					loader: "ts",
					sourcefile: "playground.ts",
				},
				bundle: true,
				write: false,
				format: "iife",
				globalName: "__playground__",
				target: "es2022",
				plugins: [voltairePlugin()],
				sourcemap: "inline",
				logLevel: "silent",
			});

			// Check for build errors
			if (result.errors.length > 0) {
				const errorMsg = result.errors
					.map((e) => {
						const loc = e.location;
						const prefix = loc ? `Line ${loc.line}: ` : "";
						return `${prefix}${e.text}`;
					})
					.join("\n");
				throw new Error(`Build failed:\n${errorMsg}`);
			}

			// Get bundled code
			const bundledCode = result.outputFiles?.[0]?.text;
			if (!bundledCode) {
				throw new Error("No output from esbuild");
			}

			// Inject module registry into global scope
			this.injectModules();

			// Execute bundled code
			// The bundled code is an IIFE that uses globalThis.__VOLTAIRE_MODULES__
			const execFn = new Function(`
				return (async () => {
					${bundledCode}
				})();
			`);

			await execFn();

			return {
				success: true,
				duration: performance.now() - startTime,
			};
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));

			// Format and log error
			console.error(this.formatError(err));

			return {
				success: false,
				error: err,
				duration: performance.now() - startTime,
			};
		}
	}

	/**
	 * Inject all registered modules into globalThis for runtime access
	 */
	private injectModules(): void {
		const modules: Record<string, unknown> = {};
		for (const [specifier, entry] of moduleRegistry) {
			modules[specifier] = entry.module;
		}
		(globalThis as Record<string, unknown>).__VOLTAIRE_MODULES__ = modules;
	}

	/**
	 * Format error for display
	 */
	private formatError(error: Error): string {
		// Try to extract line number from stack trace for better context
		const match = error.stack?.match(/<anonymous>:(\d+):(\d+)/);
		if (match) {
			const line = Number.parseInt(match[1], 10);
			return `Error at line ${line}: ${error.message}`;
		}
		return error.message;
	}
}
