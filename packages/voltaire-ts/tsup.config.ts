import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createTsUpOptions } from "@tevm/tsupconfig";
import type { Options } from "tsup";

const packageDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(packageDir, "dist");
/** Shipped WASM lives here: dist/wasm/primitives.wasm, dist/wasm/crypto/*.wasm. */
const distWasmDir = path.join(distDir, "wasm");
/** Fresh WASM from `pnpm --filter @tevm/zig build:wasm`, committed in git. */
const wasmSourceDir = path.join(packageDir, "../voltaire-zig/wasm");

/**
 * Every bundled `new URL("<...>.wasm", import.meta.url)` names its asset
 * relative to its source file. With `splitting: false` the same module is
 * inlined into entries at different depths, so no single relative literal
 * works. This plugin rewrites each literal, per output file, to the asset in
 * dist/wasm. The asset is the path after the first `wasm/` or `wasm-loader/`
 * segment: `../../wasm/crypto/ripemd160.wasm` -> `crypto/ripemd160.wasm`.
 * CJS output reads `importMetaUrl` from the tsup shim instead.
 */
const WASM_URL =
	/new URL\(\s*(["'`])([^"'`]*\.wasm)\1\s*,\s*(import\.meta\.url|importMetaUrl)\s*\)/g;

function wasmAssetName(literal: string): string | null {
	const match = literal.match(/(?:^|\/)wasm(?:-loader)?\/(.+\.wasm)$/);
	return match?.[1] ?? null;
}

function rewriteWasmUrls(code: string, outputFile: string): string {
	return code.replace(WASM_URL, (_whole, quote, literal, base) => {
		const asset = wasmAssetName(literal);
		if (!asset) {
			throw new Error(
				`${outputFile}: cannot map ${literal} to an asset in dist/wasm`,
			);
		}
		if (!existsSync(path.join(wasmSourceDir, asset))) {
			throw new Error(
				`${outputFile}: ${literal} needs ${asset}, missing from ${wasmSourceDir}. Run pnpm --filter @tevm/zig build:wasm.`,
			);
		}
		let rel = path
			.relative(path.dirname(outputFile), path.join(distWasmDir, asset))
			.split(path.sep)
			.join("/");
		if (!rel.startsWith(".")) rel = `./${rel}`;
		return `new URL(${quote}${rel}${quote}, ${base})`;
	});
}

const wasmAssetUrls = {
	name: "voltaire-wasm-asset-urls",
	renderChunk(code: string, chunk: { path: string }) {
		if (!/\.(c|m)?js$/.test(chunk.path)) return;
		const next = rewriteWasmUrls(code, chunk.path);
		return next === code ? undefined : { code: next };
	},
};

/** Copies every *.wasm under the source directory into dist/wasm. */
async function copyWasmAssets(): Promise<void> {
	const assets = existsSync(wasmSourceDir)
		? readdirSync(wasmSourceDir, { recursive: true })
				.map(String)
				.filter((name) => name.endsWith(".wasm"))
		: [];
	if (assets.length === 0) {
		throw new Error(
			`No WASM assets in ${wasmSourceDir}. Run pnpm --filter @tevm/zig build:wasm.`,
		);
	}
	for (const asset of assets) {
		const target = path.join(distWasmDir, asset);
		mkdirSync(path.dirname(target), { recursive: true });
		copyFileSync(path.join(wasmSourceDir, asset), target);
	}
}

// Pure JS entry points - no native FFI dependencies
const pureJsEntries = [
	"src/index.ts",
	// Core modules
	"src/jsonrpc/index.ts",
	"src/provider/index.ts",
	"src/utils/index.ts",
	// EVM modules (top-level and subpaths used in docs)
	"src/evm/index.ts",
	"src/evm/Frame/index.ts",
	"src/evm/Host/index.ts",
	"src/evm/block/index.ts",
	"src/evm/context/index.ts",
	"src/evm/arithmetic/index.ts",
	"src/evm/bitwise/index.ts",
	"src/evm/comparison/index.ts",
	"src/evm/keccak/index.ts",
	"src/evm/memory/index.ts",
	"src/evm/system/index.ts",
	"src/evm/log/index.ts",
	"src/evm/control/index.ts",
	"src/evm/stack/handlers/index.ts",
	"src/evm/storage/handlers/index.ts",
	"src/evm/precompiles/precompiles.ts",
	"src/evm/precompiles/index.ts",
	// Primitives
	"src/primitives/Abi/index.ts",
	"src/primitives/AccessList/index.ts",
	"src/primitives/Address/index.ts",
	"src/primitives/Address/functional.ts",
	"src/primitives/Authorization/index.ts",
	"src/primitives/Base64/index.ts",
	"src/primitives/BinaryTree/index.ts",
	"src/primitives/Blob/index.ts",
	"src/primitives/BlockAccessList/index.ts",
	"src/primitives/BloomFilter/index.ts",
	"src/primitives/Bytecode/index.ts",
	"src/primitives/Bytes/index.ts",
	"src/primitives/Chain/index.js",
	"src/primitives/ContractCode/index.ts",
	"src/primitives/InitCode/index.ts",
	"src/primitives/Denomination/index.js",
	"src/primitives/Ens/index.ts",
	"src/primitives/EventLog/index.ts",
	"src/primitives/errors/index.ts",
	"src/primitives/ExecutionPayloadBid/index.ts",
	"src/primitives/FeeMarket/index.js",
	"src/primitives/GasConstants/index.ts",
	"src/primitives/Hardfork/index.ts",
	"src/primitives/Hash/index.ts",
	"src/primitives/Hex/index.ts",
	"src/primitives/LogFilter/index.ts",
	"src/primitives/Opcode/index.ts",
	"src/primitives/Rlp/index.ts",
	"src/primitives/Signature/index.ts",
	"src/primitives/PrivateKey/index.ts",
	"src/primitives/PublicKey/index.ts",
	"src/primitives/Siwe/index.ts",
	"src/primitives/State/index.ts",
	"src/primitives/Transaction/index.ts",
	"src/primitives/Trie/index.ts",
	"src/primitives/Uint/index.ts",
	// Crypto (pure JS)
	"src/crypto/Bip39/index.js",
	"src/crypto/Blake2/index.ts",
	"src/crypto/ChaCha20Poly1305/index.ts",
	"src/crypto/ConstantTime/index.ts",
	"src/crypto/Ed25519/index.js",
	"src/crypto/EIP712/index.js",
	"src/crypto/HDWallet/index.ts",
	"src/crypto/Keccak256/index.ts",
	// WASM Keccak256 (./Keccak256/wasm)
	"src/crypto/keccak256.wasm.ts",
	"src/crypto/KZG/index.js",
	"src/crypto/P256/index.js",
	"src/crypto/Ripemd160/index.ts",
	"src/crypto/Secp256k1/index.js",
	"src/crypto/SHA256/index.ts",
	// WASM
	"src/wasm/index.ts",
	// Functional API entrypoint
	"src/functional.ts",
	// Streaming primitives
	"src/block/index.ts",
	"src/contract/index.ts",
	"src/transaction/index.ts",
	"src/stream/index.ts",
	// Additional crypto modules (pure JS)
	"src/crypto/AesGcm/index.ts",
	"src/crypto/Bls12381/index.ts",
	"src/crypto/bn254/index.ts",
	"src/crypto/HMAC/index.ts",
	"src/crypto/Keystore/index.ts",
	"src/crypto/ModExp/index.ts",
	"src/crypto/X25519/index.ts",
	"src/crypto/signers/index.ts",
];

// Native FFI entry points - require ffi-napi/ref-napi
const nativeEntries = [
	"src/native/index.ts",
	"src/crypto/Keccak256/Keccak256.native.ts",
];

// Pure JS config - no native dependencies
const pureJsConfig = createTsUpOptions({
	target: "js",
	entry: pureJsEntries,
});

// Native config - with FFI dependencies marked as external
const nativeConfig = createTsUpOptions({
	target: "js",
	entry: nativeEntries,
});

// Export separate configs to prevent FFI leaking into pure JS bundles
const pureConfigs = Array.isArray(pureJsConfig) ? pureJsConfig : [pureJsConfig];
const nativeConfigs = Array.isArray(nativeConfig)
	? nativeConfig
	: [nativeConfig];

// `shims` gives CJS output a real import.meta.url, which the WASM loaders need.
const shared: Options = { shims: true, plugins: [wasmAssetUrls] };

export default [
	// Pure JS bundles - no external FFI
	...pureConfigs.map((c, i) => ({
		...c,
		...shared,
		...(i === 0 ? { onSuccess: copyWasmAssets } : {}),
	})),
	// Native bundles - FFI marked as external
	...nativeConfigs.map((c) => ({
		...c,
		...shared,
		external: [...(c.external || []), "ffi-napi", "ref-napi", "ref-struct-di"],
	})),
];
