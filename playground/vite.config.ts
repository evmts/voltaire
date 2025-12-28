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

				// Serve voltaire .d.ts files for Monaco LSP
				// Match patterns like /voltaire/primitives/Address.d.ts
				const dtsMatch = req.url?.match(
					/^\/(voltaire\/(primitives|crypto|evm)\/([^/.]+))\.d\.ts$/,
				);
				if (dtsMatch) {
					const [, modulePath, category, moduleName] = dtsMatch;

					// Serve simplified type stubs that provide basic intellisense
					// Full types are too complex due to bundler chunking
					const typeStubs: Record<string, string> = {
						"voltaire/primitives/Address": `
declare module "voltaire/primitives/Address" {
  type AddressType = Uint8Array & { readonly __brand: "Address" };

  interface Address {
    (value: string | Uint8Array | bigint): AddressType;
    fromHex(hex: string): AddressType;
    fromBytes(bytes: Uint8Array): AddressType;
    fromNumber(n: bigint): AddressType;
    fromBase64(b64: string): AddressType;
    fromPublicKey(pubkey: Uint8Array): AddressType;
    fromPrivateKey(privkey: Uint8Array): AddressType;
    toHex(addr: AddressType): string;
    toBytes(addr: AddressType): Uint8Array;
    equals(a: AddressType, b: AddressType): boolean;
    zero(): AddressType;
    isValid(value: unknown): boolean;
  }

  const Address: Address;
  export { Address, AddressType };
  export default Address;
}`,
						"voltaire/primitives/Hex": `
declare module "voltaire/primitives/Hex" {
  type HexType = \`0x\${string}\` & { readonly __brand: "Hex" };

  interface Hex {
    (value: string | Uint8Array): HexType;
    fromString(str: string): HexType;
    fromBytes(bytes: Uint8Array): HexType;
    toBytes(hex: HexType): Uint8Array;
    toString(hex: HexType): string;
    concat(...hexes: HexType[]): HexType;
    slice(hex: HexType, start?: number, end?: number): HexType;
    isValid(value: unknown): boolean;
  }

  const Hex: Hex;
  export { Hex, HexType };
  export default Hex;
}`,
						"voltaire/crypto/Keccak256": `
declare module "voltaire/crypto/Keccak256" {
  function hash(data: Uint8Array): Uint8Array;
  function hashString(str: string): Uint8Array;
  function hashHex(hex: string): Uint8Array;
  export { hash, hashString, hashHex };
}`,
						"voltaire/crypto/Secp256k1": `
declare module "voltaire/crypto/Secp256k1" {
  function derivePublicKey(privateKey: Uint8Array): Uint8Array;
  function sign(message: Uint8Array, privateKey: Uint8Array): Uint8Array;
  function verify(message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): boolean;
  function recoverPublicKey(message: Uint8Array, signature: Uint8Array): Uint8Array;
  function randomPrivateKey(): Uint8Array;
  export { derivePublicKey, sign, verify, recoverPublicKey, randomPrivateKey };
}`,
						"voltaire/crypto/SHA256": `
declare module "voltaire/crypto/SHA256" {
  function hash(data: Uint8Array): Uint8Array;
  function hashString(str: string): Uint8Array;
  export { hash, hashString };
}`,
					};

					// Serve raw type content (without declare module wrapper)
					// modern-monaco's importMap handles module mapping
					const rawTypeStubs: Record<string, string> = {
						"voltaire/primitives/Address": `
type AddressType = Uint8Array & { readonly __brand: "Address" };

interface AddressNamespace {
  (value: string | Uint8Array | bigint): AddressType;
  fromHex(hex: string): AddressType;
  fromBytes(bytes: Uint8Array): AddressType;
  fromNumber(n: bigint): AddressType;
  fromBase64(b64: string): AddressType;
  fromPublicKey(pubkey: Uint8Array): AddressType;
  fromPrivateKey(privkey: Uint8Array): AddressType;
  toHex(addr: AddressType): string;
  toBytes(addr: AddressType): Uint8Array;
  equals(a: AddressType, b: AddressType): boolean;
  zero(): AddressType;
  isValid(value: unknown): boolean;
}

export const Address: AddressNamespace;
export type { AddressType };
export default Address;
`,
						"voltaire/primitives/Hex": `
type HexType = \`0x\${string}\` & { readonly __brand: "Hex" };

interface HexNamespace {
  (value: string | Uint8Array): HexType;
  fromString(str: string): HexType;
  fromBytes(bytes: Uint8Array): HexType;
  toBytes(hex: HexType): Uint8Array;
  toString(hex: HexType): string;
  concat(...hexes: HexType[]): HexType;
  slice(hex: HexType, start?: number, end?: number): HexType;
  isValid(value: unknown): boolean;
}

export const Hex: HexNamespace;
export type { HexType };
export default Hex;
`,
						"voltaire/crypto/Keccak256": `
export function hash(data: Uint8Array): Uint8Array;
export function hashString(str: string): Uint8Array;
export function hashHex(hex: string): Uint8Array;
`,
						"voltaire/crypto/Secp256k1": `
export function derivePublicKey(privateKey: Uint8Array): Uint8Array;
export function sign(message: Uint8Array, privateKey: Uint8Array): Uint8Array;
export function verify(message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): boolean;
export function recoverPublicKey(message: Uint8Array, signature: Uint8Array): Uint8Array;
export function randomPrivateKey(): Uint8Array;
`,
						"voltaire/crypto/SHA256": `
export function hash(data: Uint8Array): Uint8Array;
export function hashString(str: string): Uint8Array;
`,
					};

					const stub = rawTypeStubs[modulePath] || typeStubs[modulePath];
					if (stub) {
						res.setHeader("Content-Type", "application/typescript");
						res.setHeader("Access-Control-Allow-Origin", "*");
						res.end(stub);
						return;
					}

					// Fallback: serve empty module declaration
					const fallback = `declare module "${modulePath}" { const _exports: any; export = _exports; }`;
					res.setHeader("Content-Type", "application/typescript");
					res.setHeader("Access-Control-Allow-Origin", "*");
					res.end(fallback);
					return;
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
			"voltaire/primitives/Address": resolve(
				__dirname,
				"../src/primitives/Address",
			),
			"voltaire/primitives/Hex": resolve(__dirname, "../src/primitives/Hex"),
			"voltaire/primitives/Hash": resolve(__dirname, "../src/primitives/Hash"),
			"voltaire/primitives/RLP": resolve(__dirname, "../src/primitives/Rlp"),
			"voltaire/primitives/Rlp": resolve(__dirname, "../src/primitives/Rlp"),
			"voltaire/primitives/ABI": resolve(__dirname, "../src/primitives/Abi"),
			"voltaire/primitives/Abi": resolve(__dirname, "../src/primitives/Abi"),
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
			"voltaire/evm/Frame": resolve(__dirname, "../src/evm/Frame"),
			"voltaire/evm/Host": resolve(__dirname, "../src/evm/Host"),
			"voltaire/evm/Arithmetic": resolve(__dirname, "../src/evm/arithmetic"),
		},
	},
	server: {
		fs: {
			allow: [".."],
		},
	},
});
