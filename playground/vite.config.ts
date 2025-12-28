import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { type Plugin, defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Plugin to copy esbuild.wasm to public/ for runtime access
function copyEsbuildWasmPlugin(): Plugin {
	return {
		name: "copy-esbuild-wasm",
		buildStart() {
			const src = resolve(__dirname, "node_modules/esbuild-wasm/esbuild.wasm");
			const publicDir = resolve(__dirname, "public");
			const dest = resolve(publicDir, "esbuild.wasm");

			// Create public dir if it doesn't exist
			if (!existsSync(publicDir)) {
				mkdirSync(publicDir, { recursive: true });
			}

			// Copy WASM file if source exists
			if (existsSync(src)) {
				copyFileSync(src, dest);
			}
		},
	};
}

// Plugin to serve typescript as ESM and transform worker imports
function modernMonacoPlugin(): Plugin {
	return {
		name: "modern-monaco-support",
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				// Serve typescript as ESM
				if (req.url === "/typescript" || req.url === "/typescript.js") {
					const tsPath = resolve(
						__dirname,
						"node_modules/typescript/lib/typescript.js",
					);
					const content = readFileSync(tsPath, "utf-8");
					const esmContent = `${content}\nexport default ts;\nexport { ts };`;
					res.setHeader("Content-Type", "application/javascript");
					res.end(esmContent);
					return;
				}

				// Serve voltaire .d.ts files for Monaco LSP from tsup build
				if (req.url === "/voltaire.d.ts") {
					const dtsPath = resolve(__dirname, "../dist/index.d.ts");
					try {
						const content = readFileSync(dtsPath, "utf-8");
						res.setHeader("Content-Type", "application/typescript");
						res.setHeader("Access-Control-Allow-Origin", "*");
						res.end(content);
						return;
					} catch {
						// Fallback stub
						res.setHeader("Content-Type", "application/typescript");
						res.end(`export * from "./primitives/index.js"; export * from "./crypto/index.js";`);
						return;
					}
				}

				if (req.url === "/voltaire/wasm.d.ts") {
					const dtsPath = resolve(__dirname, "../dist/wasm/index.d.ts");
					try {
						const content = readFileSync(dtsPath, "utf-8");
						res.setHeader("Content-Type", "application/typescript");
						res.setHeader("Access-Control-Allow-Origin", "*");
						res.end(content);
						return;
					} catch {
						// Fallback stub
						res.setHeader("Content-Type", "application/typescript");
						res.end(`export function keccak256(data: Uint8Array): Uint8Array;`);
						return;
					}
				}

				// Transform worker files to rewrite bare typescript import
				if (
					req.url?.includes("modern-monaco") &&
					req.url?.endsWith("worker.mjs")
				) {
					const filePath = resolve(__dirname, req.url.replace(/^\//, ""));
					try {
						let content = readFileSync(filePath, "utf-8");
						// Rewrite bare specifier to absolute path
						content = content.replace(
							/import\s+ts\s+from\s+["']typescript["']/g,
							'import ts from "/typescript"',
						);
						res.setHeader("Content-Type", "application/javascript");
						res.end(content);
						return;
					} catch {
						// Fall through to next handler
					}
				}

				next();
			});
		},
	};
}

export default defineConfig({
	plugins: [modernMonacoPlugin(), copyEsbuildWasmPlugin()],
	test: {
		environment: "jsdom",
	},
	optimizeDeps: {
		exclude: ["modern-monaco", "esbuild-wasm"],
		include: ["typescript"],
	},
	resolve: {
		alias: {
			// Stub native-only modules for browser
			"c-kzg": resolve(__dirname, "src/runtime/browser-stubs.ts"),
			bindings: resolve(__dirname, "src/runtime/browser-stubs.ts"),
			// Force esbuild-wasm to use ESM browser version (rolldown-vite doesn't respect browser field)
			"esbuild-wasm": resolve(
				__dirname,
				"node_modules/esbuild-wasm/esm/browser.js",
			),
			// Serve typescript as ESM for workers
			typescript: resolve(
				__dirname,
				"node_modules/typescript/lib/typescript.js",
			),
			// Main entry points
			"voltaire/wasm": resolve(__dirname, "../src/wasm/index.ts"),
			voltaire: resolve(__dirname, "../src/index.ts"),
		},
	},
	server: {
		fs: {
			allow: [".."],
		},
	},
});
