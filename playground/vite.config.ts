import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";

// Plugin to serve typescript as ESM and transform worker imports
function typescriptEsmPlugin(): Plugin {
	return {
		name: "typescript-esm",
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
	plugins: [typescriptEsmPlugin()],
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
			"voltaire/primitives/Address": resolve(
				__dirname,
				"../src/primitives/Address",
			),
			"voltaire/primitives/Hex": resolve(__dirname, "../src/primitives/Hex"),
			"voltaire/primitives/Hash": resolve(__dirname, "../src/primitives/Hash"),
			"voltaire/primitives/RLP": resolve(__dirname, "../src/primitives/RLP"),
			"voltaire/primitives/ABI": resolve(__dirname, "../src/primitives/ABI"),
			"voltaire/crypto/Keccak256": resolve(
				__dirname,
				"../src/crypto/Keccak256",
			),
			"voltaire/crypto/Secp256k1": resolve(
				__dirname,
				"../src/crypto/Secp256k1",
			),
			"voltaire/crypto/SHA256": resolve(__dirname, "../src/crypto/SHA256"),
			"voltaire/crypto/Blake2": resolve(__dirname, "../src/crypto/Blake2"),
			"voltaire/crypto/Ripemd160": resolve(
				__dirname,
				"../src/crypto/Ripemd160",
			),
			"voltaire/crypto/HDWallet": resolve(__dirname, "../src/crypto/HDWallet"),
		},
	},
	server: {
		fs: {
			allow: [".."],
		},
	},
});
