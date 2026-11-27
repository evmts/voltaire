/**
 * Native FFI bindings for Ethereum primitives and cryptography.
 * Uses synchronous Bun FFI (`dlopen`) or Node-API (`createRequire`) for maximum
 * performance with 1:1 synchronous API parity against `@tevm/voltaire`.
 */

import type { VoltaireAPI } from "../api-interface.js";

// ============================================================================
// Primitives - Re-export from JS (pass-through)
// ============================================================================
export {
	// Core primitives
	Address,
	BrandedAddress,
	Hash,
	BrandedHash,
	HashType,
	Hex,
	BrandedHex,

	// Numeric types - Unsigned integers
	Uint,
	BrandedUint,
	Uint8,
	BrandedUint8,
	Uint16,
	BrandedUint16,
	Uint32,
	BrandedUint32,
	Uint64,
	BrandedUint64,
	Uint128,
	BrandedUint128,
	Uint256,

	// Numeric types - Signed integers
	Int8,
	BrandedInt8,
	Int16,
	BrandedInt16,
	Int32,
	BrandedInt32,
	Int64,
	BrandedInt64,
	Int128,
	BrandedInt128,
	Int256,
	BrandedInt256,

	// Denomination
	Wei,
	Gwei,
	Ether,
	BrandedWei,
	BrandedGwei,
	BrandedEther,

	// Encoding
	Rlp,
	BrandedRlp,
	Ssz,
	Abi,
	BrandedAbi,

	// Transactions
	Transaction,
	AccessList,
	BrandedAccessList,
	BlockAccessList,
	ExecutionPayloadBid,
	Authorization,
	BrandedAuthorization,

	// EVM
	Bytecode,
	BrandedBytecode,
	ContractCode,
	InitCode,
	RuntimeCode,
	Metadata,
	SourceMap,
	Opcode,
	BrandedOpcode,
	Gas,
	GasConstants,
	GasCosts,
	GasUsed,
	GasEstimate,
	GasRefund,
	StorageKey,
	BrandedStorageKey,
	State,
	Storage,
	Proxy,

	// Protocol
	Blob,
	BrandedBlob,
	Chain,
	BrandedChain,
	FeeMarket,
	BrandedFeeMarket,
	Hardfork,
	ForkId,

	// Network & Peer information
	NetworkId,
	ProtocolVersion,
	PeerId,
	NodeInfo,
	PeerInfo,

	// Consensus layer (post-merge)
	Slot,
	Epoch,
	ValidatorIndex,
	WithdrawalIndex,
	BeaconBlockRoot,
	Withdrawal,

	// Block types
	Block,
	BlockBody,
	BlockHeader,
	Uncle,

	// Events & Logs
	EventLog,
	BrandedEventLog,

	// Filters
	FilterId,
	TopicFilter,
	LogFilter,
	BlockFilter,
	PendingTransactionFilter,

	// Contract interaction results
	ReturnData,
	RevertReason,
	ContractResult,
	EncodedData,
	DecodedData,

	// Compiler & Source metadata
	CompilerVersion,
	License,

	// Execution tracing (debug_trace* methods)
	TraceConfig,
	OpStep,
	StructLog,
	CallTrace,
	TraceResult,
	MemoryDump,
	StorageDiff,
	StateDiff,
	SyncStatus,
	ChainHead,

	// Function & Event Selectors
	Selector,
	FunctionSignature,
	EventSignature,
	ErrorSignature,

	// Receipts & Transaction Metadata
	TransactionHash,
	TransactionIndex,
	LogIndex,
	TransactionStatus,
	BlockHash,
	BlockNumber,
	Receipt,

	// Standards
	Siwe,
	BrandedSiwe,
	Ens,
	Permit,
	TransactionUrl,

	// EIP-712 Typed Data
	DomainSeparator,
	Domain,
	TypedData,

	// Signatures (EIP-191, EIP-1271)
	SignedData,
	ContractSignature,

	// Privacy (ERC-5564)
	StealthAddress,

	// Data structures
	BinaryTree,
	BrandedBinaryTree,
	BloomFilter,
	BrandedBloomFilter,

	// Utilities - Base64
	Base64,
	BrandedBase64,

	// Utilities - Bytes types
	Bytes,
	BrandedBytes,
	Bytes1,
	BrandedBytes1,
	Bytes2,
	BrandedBytes2,
	Bytes3,
	BrandedBytes3,
	Bytes4,
	BrandedBytes4,
	Bytes5,
	BrandedBytes5,
	Bytes6,
	BrandedBytes6,
	Bytes7,
	BrandedBytes7,
	Bytes8,
	BrandedBytes8,
	Bytes16,
	BrandedBytes16,
	Bytes32,
	BrandedBytes32,
	Bytes64,
	BrandedBytes64,
} from "../primitives/index.js";

// Errors
export * from "../primitives/errors/index.js";

// ============================================================================
// Crypto - Synchronous Native FFI implementations + JS pass-throughs
// ============================================================================
export {
	AesGcm,
	Blake2,
	Bls12381,
	BN254,
	Ed25519,
	Keccak256,
	KZG,
	ModExp,
	P256,
	Ripemd160,
	Secp256k1,
	SHA256,
	X25519,
} from "./crypto/index.js";

// Explicit *Native aliases for advanced users
export {
	AesGcm as AesGcmNative,
	Blake2 as Blake2Native,
	Bls12381 as Bls12381Native,
	BN254 as BN254Native,
	Ed25519 as Ed25519Native,
	Keccak256 as Keccak256Native,
	Keccak256Hash as Keccak256HashNative,
	KZG as KZGNative,
	ModExp as ModExpNative,
	P256 as P256Native,
	Ripemd160 as Ripemd160Native,
	Secp256k1 as Secp256k1Native,
	SHA256 as SHA256Native,
	X25519 as X25519Native,
} from "./crypto/index.js";

// Additional pure-JS crypto utilities
export {
	Bip39,
	ChaCha20Poly1305,
	ConstantTime,
	EIP712,
	Keystore,
} from "../crypto/index.js";

export * as HDWallet from "../crypto/HDWallet/native.js";

// Re-export crypto types
export type { Keccak256Hash } from "../crypto/Keccak256/Keccak256HashType.js";
export type {
	Blake2Hash,
	Blake2HashType,
	Bls12381Fp2Type,
	Bls12381G1PointType,
	Bls12381G2PointType,
	Keccak256HashType,
	KzgBlobType,
	KzgCommitmentType,
	KzgProofType,
	Ripemd160Hash,
	Ripemd160HashType,
	SHA256Hash,
	SHA256HashType,
} from "../crypto/index.js";

// ============================================================================
// Standards - Re-export from JS (pass-through)
// ============================================================================
export * from "../standards/index.js";

// ============================================================================
// WASM primitives (high-performance WebAssembly bindings)
// ============================================================================
export * as wasm from "../wasm/index.js";

// ============================================================================
// EVM execution (frame, host, instruction handlers)
// ============================================================================
export * as evm from "../evm/index.js";

// ============================================================================
// Precompiles (0x01-0x0a + BLS)
// ============================================================================
export * as precompiles from "../evm/precompiles/precompiles.js";

// ============================================================================
// Native-specific utilities (for advanced users)
// ============================================================================
export {
	allocateOutput,
	allocateStringOutput,
	type BunNativeSymbols,
	bunFfiSymbols,
	checkError,
	getLoadedBunLibPath,
	getNativeErrorMessage,
	getNativeExtension,
	getNativeLibCandidates,
	getNativeLibPath,
	getNativeLibPrefix,
	getPlatform,
	isBun,
	isNativeLoaded,
	isNativeSupported,
	isNode,
	loadBunNative,
	loadBunNativeSync,
	loadForkWasm,
	loadNative,
	loadNativeSync,
	loadNodeNative,
	loadNodeNativeSync,
	NativeError,
	NativeErrorCode,
	type NativeErrorCodeType,
	type NativeExtension,
	type NativeLibrary,
	NativeLibraryNotFoundError,
	type NativeModule,
	type NativePathOptions,
	type NativeRuntimeKind,
	NativeUnsupportedPlatformError,
	NativeUnsupportedRuntimeError,
	type Platform,
	resolveNativeLibPath,
	safeBufferPtr,
	toCStringBuffer,
	unloadNative,
} from "../native-loader/index.js";

// ============================================================================
// Type assertion - Verify ACTUAL native exports satisfy VoltaireAPI 1:1
// ============================================================================
import { EIP712 } from "../crypto/EIP712/index.js";
import { Abi } from "../primitives/Abi/Abi.js";
import { AccessList } from "../primitives/AccessList/index.js";
import { Address } from "../primitives/Address/index.js";
import { Blob } from "../primitives/Blob/index.js";
import { BloomFilter } from "../primitives/BloomFilter/index.js";
import { Bytecode } from "../primitives/Bytecode/index.js";
import { Bytes } from "../primitives/Bytes/Bytes.js";
import { Bytes32 } from "../primitives/Bytes/Bytes32/index.js";
import { Chain } from "../primitives/Chain/index.js";
import { Ether, Gwei, Wei } from "../primitives/Denomination/index.js";
import { Hash } from "../primitives/Hash/index.js";
import { Hex } from "../primitives/Hex/index.js";
import { Opcode } from "../primitives/Opcode/index.js";
import { Rlp } from "../primitives/Rlp/index.js";
import { Siwe } from "../primitives/Siwe/index.js";
import { StorageKey } from "../primitives/State/index.js";
import { Uint } from "../primitives/Uint/Uint.js";
import {
	Blake2,
	Bls12381,
	BN254,
	Ed25519,
	Keccak256,
	KZG,
	ModExp,
	P256,
	Ripemd160,
	Secp256k1,
	SHA256,
	X25519,
} from "./crypto/index.js";

/**
 * Native API object verified directly against `VoltaireAPI` using the REAL
 * synchronous native crypto implementations (zero JS stand-in workarounds).
 */
const _nativeAPI = {
	// Primitives
	Address,
	Hash,
	Hex,
	Uint,
	Rlp,
	Abi,
	Blob,
	AccessList,
	Bytecode,
	Chain,
	Opcode,
	BloomFilter,
	Siwe,
	Bytes,
	Bytes32,
	StorageKey,
	Wei,
	Gwei,
	Ether,

	// Real synchronous native crypto modules
	Keccak256,
	SHA256,
	Blake2,
	Ripemd160,
	Secp256k1,
	Ed25519,
	P256,
	X25519,
	BN254,
	Bls12381,
	KZG,
	EIP712,
	ModExp,
} satisfies VoltaireAPI;

export { _nativeAPI as nativeAPI };

// ============================================================================
// Streaming primitives (pure JS - same as main entrypoint)
// ============================================================================
export * as block from "../block/index.js";
export * as contract from "../contract/index.js";
export * as stream from "../stream/index.js";
export * as transaction from "../transaction/index.js";

// ============================================================================
// Wallet utilities (native-only hardware wallets)
// ============================================================================
export type { HardwareWallet } from "../wallet/hardware/HardwareWallet.js";
export * as wallet from "../wallet/index.js";
