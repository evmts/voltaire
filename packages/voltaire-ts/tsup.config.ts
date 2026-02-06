import { createTsUpOptions } from "@tevm/tsupconfig";

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
	"src/primitives/FeeMarket/index.js",
	"src/primitives/GasConstants/index.ts",
	"src/primitives/Hardfork/index.ts",
	"src/primitives/Hash/index.ts",
	"src/primitives/Hex/index.ts",
	"src/primitives/LogFilter/index.ts",
	// Effect Schema entrypoints
	"src/primitives/Hash/effect.ts",
	"src/primitives/Hex/effect.ts",
	"src/primitives/Uint/effect.ts",
	"src/primitives/Transaction/effect.ts",
	"src/primitives/Signature/effect.ts",
	"src/primitives/Bytecode/effect.ts",
	"src/primitives/Base64/effect.ts",
	"src/primitives/Ens/effect.ts",
	"src/primitives/EventLog/effect.ts",
	"src/primitives/AccessList/effect.ts",
	"src/primitives/Transaction/Authorization/effect.ts",
	"src/primitives/Opcode/index.ts",
	"src/primitives/Rlp/effect.ts",
	"src/primitives/Blob/effect.ts",
	"src/primitives/State/effect.ts",
	"src/primitives/Rlp/index.ts",
	"src/primitives/Signature/index.ts",
	"src/primitives/PrivateKey/index.ts",
	"src/primitives/PublicKey/index.ts",
	"src/primitives/Siwe/index.ts",
	"src/primitives/State/index.ts",
	"src/primitives/Transaction/index.ts",
	"src/primitives/Uint/index.ts",
	// Crypto (pure JS only - no HDWallet, no native Keccak256)
	"src/crypto/Bip39/index.js",
	"src/crypto/Blake2/index.ts",
	"src/crypto/ChaCha20Poly1305/index.ts",
	"src/crypto/Ed25519/index.js",
	"src/crypto/EIP712/index.js",
	"src/crypto/Keccak256/index.ts",
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
	"src/crypto/HDWallet/index.ts",
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

export default [
	// Pure JS bundles - no external FFI
	...pureConfigs,
	// Native bundles - FFI marked as external
	...nativeConfigs.map((c) => ({
		...c,
		external: [...(c.external || []), "ffi-napi", "ref-napi", "ref-struct-di"],
	})),
];
