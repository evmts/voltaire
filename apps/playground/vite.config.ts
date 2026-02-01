import {
	copyFileSync,
	cpSync,
	existsSync,
	mkdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Map @tevm/voltaire subpath exports to source files
function voltaireSubpathResolver(): Plugin {
	const primitives = [
		"Abi",
		"AccessList",
		"Address",
		"Authorization",
		"Base64",
		"BinaryTree",
		"Blob",
		"BloomFilter",
		"Bytecode",
		"Bytes",
		"Chain",
		"ContractCode",
		"Denomination",
		"Ens",
		"EventLog",
		"errors",
		"FeeMarket",
		"GasConstants",
		"Hardfork",
		"Hash",
		"Hex",
		"InitCode",
		"LogFilter",
		"Opcode",
		"Rlp",
		"PrivateKey",
		"PublicKey",
		"Signature",
		"Siwe",
		"State",
		"Transaction",
		"Uint",
	];

	const crypto = [
		"AesGcm",
		"Bip39",
		"Blake2",
		"Bls12381",
		"BN254",
		"ChaCha20Poly1305",
		"Ed25519",
		"EIP712",
		"HDWallet",
		"HMAC",
		"Keccak256",
		"Keystore",
		"KZG",
		"PBKDF2",
		"Ripemd160",
		"Scrypt",
		"Secp256k1",
		"SHA256",
		"X25519",
	];

	const topLevel = ["block", "contract", "transaction", "stream"];

	return {
		name: "voltaire-subpath-resolver",
		resolveId(source) {
			// Handle @tevm/voltaire main entry
			if (source === "@tevm/voltaire") {
				return resolve(__dirname, "../src/index.ts");
			}
			// Handle @tevm/voltaire/wasm
			if (source === "@tevm/voltaire/wasm") {
				return resolve(__dirname, "../src/wasm/index.ts");
			}
			// Handle @tevm/voltaire subpath imports
			if (source.startsWith("@tevm/voltaire/")) {
				const subpath = source.replace("@tevm/voltaire/", "");
				const basePath = subpath.split("/")[0];

				// Handle /effect subpaths like Hash/effect
				if (subpath.endsWith("/effect")) {
					const primName = subpath.replace("/effect", "");
					if (primitives.includes(primName)) {
						return resolve(__dirname, `../src/primitives/${primName}/effect.ts`);
					}
				}

				// Helper to find index file with .ts or .js extension
				const findIndex = (dir: string) => {
					const tsPath = resolve(__dirname, `${dir}/index.ts`);
					if (existsSync(tsPath)) return tsPath;
					const jsPath = resolve(__dirname, `${dir}/index.js`);
					if (existsSync(jsPath)) return jsPath;
					return null;
				};

				if (primitives.includes(basePath)) {
					return findIndex(`../src/primitives/${subpath}`);
				}
				if (crypto.includes(basePath)) {
					return findIndex(`../src/crypto/${subpath}`);
				}
				if (topLevel.includes(basePath)) {
					return findIndex(`../src/${subpath}`);
				}

				// Fallback: try primitives then crypto
				const primPath = findIndex(`../src/primitives/${subpath}`);
				if (primPath) return primPath;
				const cryptoPath = findIndex(`../src/crypto/${subpath}`);
				if (cryptoPath) return cryptoPath;
			}
			return null;
		},
	};
}

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

// Plugin to copy modern-monaco dist to public/ for production
function copyModernMonacoPlugin(): Plugin {
	return {
		name: "copy-modern-monaco",
		writeBundle() {
			const src = resolve(__dirname, "node_modules/modern-monaco/dist");
			const dest = resolve(__dirname, "dist/node_modules/modern-monaco/dist");

			// Copy entire modern-monaco dist folder recursively
			if (existsSync(src)) {
				cpSync(src, dest, { recursive: true });
			}

			// Also copy typescript for workers
			const tsSrc = resolve(
				__dirname,
				"node_modules/typescript/lib/typescript.js",
			);
			const tsDest = resolve(__dirname, "dist/typescript.js");
			if (existsSync(tsSrc)) {
				// Read and convert to ESM
				const content = readFileSync(tsSrc, "utf-8");
				const esmContent = `${content}\nexport default ts;\nexport { ts };`;
				writeFileSync(tsDest, esmContent);
			}
		},
	};
}

// Plugin to serve typescript as ESM and transform worker imports
function modernMonacoPlugin(): Plugin {
	return {
		name: "modern-monaco-support",
		configureServer(server) {
			// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: middleware logic
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
						res.end(
							`export * from "./primitives/index.js"; export * from "./crypto/index.js";`,
						);
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
						res.end("export function keccak256(data: Uint8Array): Uint8Array;");
						return;
					}
				}

				// Serve dist .d.ts chunk files for Monaco type resolution
				// Monaco resolves imports like './index-CN1rqy49.js' from voltaire.d.ts
				// We need to map these .js requests to the actual .d.ts files
				if (req.url?.endsWith(".js") || req.url?.endsWith(".d.ts")) {
					const fileName = req.url.replace(/^\//, "").replace(/\.js$/, ".d.ts");
					const dtsPath = resolve(__dirname, "../dist", fileName);
					if (existsSync(dtsPath)) {
						try {
							const content = readFileSync(dtsPath, "utf-8");
							res.setHeader("Content-Type", "application/typescript");
							res.setHeader("Access-Control-Allow-Origin", "*");
							res.end(content);
							return;
						} catch {
							// Fall through to next handler
						}
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
	plugins: [
		voltaireSubpathResolver(),
		modernMonacoPlugin(),
		copyEsbuildWasmPlugin(),
		copyModernMonacoPlugin(),
	],
	test: {
		environment: "jsdom",
	},
	optimizeDeps: {
		exclude: ["modern-monaco", "esbuild-wasm"],
		include: ["typescript"],
	},
	resolve: {
		alias: {
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
			// Note: @tevm/voltaire is handled by voltaireSubpathResolver plugin
			// to properly resolve subpath imports like @tevm/voltaire/Blob
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
