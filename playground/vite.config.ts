import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";

// Voltaire type definitions for the LSP
const voltaireTypes: Record<string, string> = {
	"voltaire/primitives/Address": `
declare module "voltaire/primitives/Address" {
	export type AddressType = Uint8Array & { readonly __tag: "Address" };
	export function Address(value: number | bigint | string | Uint8Array): AddressType;
	export namespace Address {
		export const SIZE: number;
		export function from(value: number | bigint | string | Uint8Array): AddressType;
		export function fromHex(value: string): AddressType;
		export function fromBytes(value: Uint8Array): AddressType;
		export function fromNumber(value: number | bigint): AddressType;
		export function fromBase64(value: string): AddressType;
		export function fromPublicKey(publicKey: Uint8Array): AddressType;
		export function fromPrivateKey(value: Uint8Array): AddressType;
		export function zero(): AddressType;
		export function toHex(address: AddressType): string;
		export function toChecksummed(address: AddressType): string;
		export function isValid(value: unknown): boolean;
		export function equals(a: AddressType, b: AddressType): boolean;
	}
	export default Address;
}`,
	"voltaire/primitives/Hex": `
declare module "voltaire/primitives/Hex" {
	export type HexString = string & { readonly __brand: "Hex" };
	export function from(value: string | Uint8Array | number | bigint | boolean): HexString;
	export function fromString(value: string): HexString;
	export function fromBytes(value: Uint8Array): HexString;
	export function fromNumber(value: number | bigint, size?: number): HexString;
	export function toString(hex: HexString): string;
	export function toBytes(hex: HexString): Uint8Array;
	export function toNumber(hex: HexString): number;
	export function toBigInt(hex: HexString): bigint;
	export function concat(...values: HexString[]): HexString;
	export function slice(hex: HexString, start: number, end?: number): HexString;
	export function pad(hex: HexString, size: number): HexString;
	export function trim(hex: HexString): HexString;
	export function equals(a: HexString, b: HexString): boolean;
	export function size(hex: HexString): number;
	export function random(size: number): HexString;
}`,
	"voltaire/primitives/Hash": `
declare module "voltaire/primitives/Hash" {
	export type HashType = Uint8Array & { readonly __tag: "Hash" };
	export function Hash(value: string | Uint8Array): HashType;
	export namespace Hash {
		export const SIZE: number;
		export function from(value: string | Uint8Array): HashType;
		export function fromHex(value: string): HashType;
		export function fromBytes(value: Uint8Array): HashType;
		export function toHex(hash: HashType): string;
		export function equals(a: HashType, b: HashType): boolean;
		export function keccak256(data: Uint8Array): HashType;
		export function random(): HashType;
	}
	export default Hash;
}`,
	"voltaire/primitives/RLP": `
declare module "voltaire/primitives/RLP" {
	export type RLPInput = Uint8Array | RLPInput[];
	export function encode(input: RLPInput): Uint8Array;
	export function decode(input: Uint8Array): RLPInput;
}`,
	"voltaire/crypto/Keccak256": `
declare module "voltaire/crypto/Keccak256" {
	export function hash(data: Uint8Array): Uint8Array;
	export function hashString(data: string): Uint8Array;
	export function hashHex(data: string): Uint8Array;
}`,
	"voltaire/crypto/Secp256k1": `
declare module "voltaire/crypto/Secp256k1" {
	export interface Signature { r: bigint; s: bigint; v: number; }
	export function generatePrivateKey(): Uint8Array;
	export function derivePublicKey(privateKey: Uint8Array): Uint8Array;
	export function sign(messageHash: Uint8Array, privateKey: Uint8Array): Signature;
	export function verify(messageHash: Uint8Array, signature: Signature, publicKey: Uint8Array): boolean;
	export function recover(messageHash: Uint8Array, signature: Signature): Uint8Array;
}`,
	"voltaire/crypto/SHA256": `
declare module "voltaire/crypto/SHA256" {
	export function hash(data: Uint8Array): Uint8Array;
	export function hashString(data: string): Uint8Array;
	export function doubleHash(data: Uint8Array): Uint8Array;
}`,
	"voltaire/crypto/Blake2": `
declare module "voltaire/crypto/Blake2" {
	export function hash(data: Uint8Array, outputLength?: number): Uint8Array;
	export function hashString(data: string, outputLength?: number): Uint8Array;
}`,
	"voltaire/crypto/Ripemd160": `
declare module "voltaire/crypto/Ripemd160" {
	export function hash(data: Uint8Array): Uint8Array;
	export function hashString(data: string): Uint8Array;
}`,
	"voltaire/crypto/HDWallet": `
declare module "voltaire/crypto/HDWallet" {
	export interface ExtendedKey {
		privateKey?: Uint8Array;
		publicKey: Uint8Array;
		chainCode: Uint8Array;
		depth: number;
		index: number;
	}
	export function generateMasterKey(seed: Uint8Array): ExtendedKey;
	export function deriveChild(parent: ExtendedKey, index: number): ExtendedKey;
	export function derivePath(master: ExtendedKey, path: string): ExtendedKey;
}`,
};

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

				// Serve voltaire type definitions as .d.ts files
				// Match patterns like /voltaire/primitives/Address.d.ts
				const dtsMatch = req.url?.match(/^\/(voltaire\/[^.]+)\.d\.ts$/);
				if (dtsMatch) {
					const moduleName = dtsMatch[1];
					const typeDef = voltaireTypes[moduleName];
					if (typeDef) {
						res.setHeader("Content-Type", "application/typescript");
						res.setHeader("Access-Control-Allow-Origin", "*");
						res.end(typeDef);
						return;
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
