import { resolve, dirname } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Plugin to serve typescript as ESM and transform worker imports
function modernMonacoPlugin(): Plugin {
	return {
		name: "modern-monaco-support",
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				// Serve typescript as ESM
				if (req.url === "/typescript" || req.url === "/typescript.js") {
					const tsPath = resolve(__dirname, "node_modules/typescript/lib/typescript.js");
					const content = readFileSync(tsPath, "utf-8");
					const esmContent = `${content}\nexport default ts;\nexport { ts };`;
					res.setHeader("Content-Type", "application/javascript");
					res.end(esmContent);
					return;
				}

				// Serve voltaire source files as .d.ts for Monaco LSP
				// Match patterns like /voltaire/primitives/Address.d.ts
				const dtsMatch = req.url?.match(/^\/(voltaire\/(primitives|crypto)\/([^/.]+))\.d\.ts$/);
				if (dtsMatch) {
					const [, modulePath, category, moduleName] = dtsMatch;
					// Try to read the actual source index.ts file
					const srcPath = resolve(__dirname, `../src/${category}/${moduleName}/index.ts`);

					if (existsSync(srcPath)) {
						try {
							let sourceContent = readFileSync(srcPath, "utf-8");

							// Strip import statements that Monaco can't resolve
							// Keep only type exports and declarations
							sourceContent = sourceContent
								.replace(/^import\s+.*?from\s+["'][^"']+["'];?\s*$/gm, '')
								.replace(/^import\s+\{[^}]*\}\s+from\s+["'][^"']+["'];?\s*$/gm, '')
								.replace(/^import\s+type\s+.*?from\s+["'][^"']+["'];?\s*$/gm, '')
								.replace(/^export\s+\*\s+from\s+["'][^"']+["'];?\s*$/gm, '')
								.replace(/^export\s+type\s+\*\s+from\s+["'][^"']+["'];?\s*$/gm, '');

							// Wrap source in declare module for Monaco
							const moduleDecl = `declare module "${modulePath}" {\n${sourceContent}\n}`;
							res.setHeader("Content-Type", "application/typescript");
							res.setHeader("Access-Control-Allow-Origin", "*");
							res.end(moduleDecl);
							return;
						} catch {
							// Fall through
						}
					}
				}

				// Transform worker files to rewrite bare typescript import
				if (req.url?.includes("modern-monaco") && req.url?.endsWith("worker.mjs")) {
					const filePath = resolve(__dirname, req.url.replace(/^\//, ""));
					try {
						let content = readFileSync(filePath, "utf-8");
						// Rewrite bare specifier to absolute path
						content = content.replace(
							/import\s+ts\s+from\s+["']typescript["']/g,
							'import ts from "/typescript"'
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
	plugins: [modernMonacoPlugin()],
	test: {
		environment: "jsdom",
	},
	optimizeDeps: {
		exclude: ["modern-monaco"],
		include: ["typescript"],
	},
	resolve: {
		alias: {
			// Serve typescript as ESM for workers
			typescript: resolve(__dirname, "node_modules/typescript/lib/typescript.js"),
			"voltaire/primitives/Address": resolve(__dirname, "../src/primitives/Address"),
			"voltaire/primitives/Hex": resolve(__dirname, "../src/primitives/Hex"),
			"voltaire/primitives/Hash": resolve(__dirname, "../src/primitives/Hash"),
			"voltaire/primitives/RLP": resolve(__dirname, "../src/primitives/Rlp"),
			"voltaire/primitives/Rlp": resolve(__dirname, "../src/primitives/Rlp"),
			"voltaire/primitives/ABI": resolve(__dirname, "../src/primitives/Abi"),
			"voltaire/primitives/Abi": resolve(__dirname, "../src/primitives/Abi"),
			"voltaire/crypto/Keccak256": resolve(__dirname, "../src/crypto/Keccak256"),
			"voltaire/crypto/Secp256k1": resolve(__dirname, "../src/crypto/Secp256k1"),
			"voltaire/crypto/SHA256": resolve(__dirname, "../src/crypto/SHA256"),
			"voltaire/crypto/Blake2": resolve(__dirname, "../src/crypto/Blake2"),
			"voltaire/crypto/Ripemd160": resolve(__dirname, "../src/crypto/Ripemd160"),
			"voltaire/crypto/HDWallet": resolve(__dirname, "../src/crypto/HDWallet"),
		},
	},
	server: {
		fs: {
			allow: [".."],
		},
	},
});
