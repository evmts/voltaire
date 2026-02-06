/**
 * Native FFI bindings for Ethereum primitives
 * Uses Bun FFI or Node-API for maximum performance
 *
 * This entrypoint exports the same API as the main JS entrypoint (src/index.ts)
 * but with native-optimized implementations where available.
 *
 * Currently native implementations:
 * - Keccak256 (via Zig FFI)
 */
// ============================================================================
// Primitives - Re-export from JS (pass-through)
// ============================================================================
export { 
// Core primitives
Address, BrandedAddress, Hash, BrandedHash, HashType, Hex, BrandedHex, 
// Numeric types - Unsigned integers
Uint, BrandedUint, Uint8, BrandedUint8, Uint16, BrandedUint16, Uint32, BrandedUint32, Uint64, BrandedUint64, Uint128, BrandedUint128, Uint256, 
// Numeric types - Signed integers
Int8, BrandedInt8, Int16, BrandedInt16, Int32, BrandedInt32, Int64, BrandedInt64, Int128, BrandedInt128, Int256, BrandedInt256, 
// Denomination
Wei, Gwei, Ether, BrandedWei, BrandedGwei, BrandedEther, 
// Encoding
Rlp, BrandedRlp, Ssz, Abi, BrandedAbi, 
// Transactions
Transaction, AccessList, BrandedAccessList, Authorization, BrandedAuthorization, 
// EVM
Bytecode, BrandedBytecode, ContractCode, InitCode, RuntimeCode, Metadata, SourceMap, Opcode, BrandedOpcode, Gas, GasConstants, GasCosts, GasUsed, GasEstimate, GasRefund, StorageKey, BrandedStorageKey, State, Storage, Proxy, 
// Protocol
Blob, BrandedBlob, Chain, BrandedChain, FeeMarket, BrandedFeeMarket, Hardfork, ForkId, 
// Network & Peer information
NetworkId, ProtocolVersion, PeerId, NodeInfo, PeerInfo, 
// Consensus layer (post-merge)
Slot, Epoch, ValidatorIndex, WithdrawalIndex, BeaconBlockRoot, Withdrawal, 
// Block types
Block, BlockBody, BlockHeader, Uncle, 
// Events & Logs
EventLog, BrandedEventLog, 
// Filters
FilterId, TopicFilter, LogFilter, BlockFilter, PendingTransactionFilter, 
// Contract interaction results
ReturnData, RevertReason, ContractResult, EncodedData, DecodedData, 
// Compiler & Source metadata
CompilerVersion, License, 
// Execution tracing (debug_trace* methods)
TraceConfig, OpStep, StructLog, CallTrace, TraceResult, MemoryDump, StorageDiff, StateDiff, SyncStatus, ChainHead, 
// Function & Event Selectors
Selector, FunctionSignature, EventSignature, ErrorSignature, 
// Receipts & Transaction Metadata
TransactionHash, TransactionIndex, LogIndex, TransactionStatus, BlockHash, BlockNumber, Receipt, 
// Standards
Siwe, BrandedSiwe, Ens, Permit, TransactionUrl, 
// EIP-712 Typed Data
DomainSeparator, Domain, TypedData, 
// Signatures (EIP-191, EIP-1271)
SignedData, ContractSignature, 
// Privacy (ERC-5564)
StealthAddress, 
// Data structures
BinaryTree, BrandedBinaryTree, BloomFilter, BrandedBloomFilter, 
// Utilities - Base64
Base64, BrandedBase64, 
// Utilities - Bytes types
Bytes, BrandedBytes, Bytes1, BrandedBytes1, Bytes2, BrandedBytes2, Bytes3, BrandedBytes3, Bytes4, BrandedBytes4, Bytes5, BrandedBytes5, Bytes6, BrandedBytes6, Bytes7, BrandedBytes7, Bytes8, BrandedBytes8, Bytes16, BrandedBytes16, Bytes32, BrandedBytes32, Bytes64, BrandedBytes64, } from "../primitives/index.js";
// Errors
export * from "../primitives/errors/index.js";
// ============================================================================
// Crypto - Re-export JS implementations, override with native where available
// ============================================================================
// Native implementation - Keccak256 (async API - uses FFI)
// Note: Native Keccak256 has async methods (hash, from, etc.) unlike sync JS version
export { Keccak256 } from "../crypto/Keccak256/Keccak256.native.js";
// JS implementations (pass-through)
export { Secp256k1, EIP712, KZG, BN254, Bls12381, Ripemd160, SHA256, Blake2, Ed25519, AesGcm, ChaCha20Poly1305, Bip39, Keystore, P256, X25519, ModExp, } from "../crypto/index.js";
// HDWallet uses native FFI - only available in native entry point
export * as HDWallet from "../crypto/HDWallet/index.js";
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
export { loadNative, loadForkWasm, isBun, isNode, checkError, allocateOutput, allocateStringOutput, getPlatform, getNativeExtension, isNativeSupported, getNativeErrorMessage, NativeErrorCode, } from "../native-loader/index.js";
// Native Keccak256 exports for advanced users
export { Keccak256Hash as Keccak256HashNative, Keccak256 as Keccak256Native, } from "../crypto/Keccak256/Keccak256.native.js";
// ============================================================================
// Type assertion - Ensure API compatibility with JS entrypoint
// ============================================================================
// Import JS namespaces for type checking (use JS Keccak256 for satisfies check)
import { Address } from "../primitives/Address/index.js";
import { Hash } from "../primitives/Hash/index.js";
import { Hex } from "../primitives/Hex/index.js";
import { Uint } from "../primitives/Uint/Uint.js";
import { Rlp } from "../primitives/Rlp/index.js";
import { Abi } from "../primitives/Abi/Abi.js";
import { Blob } from "../primitives/Blob/index.js";
import { AccessList } from "../primitives/AccessList/index.js";
import { Bytecode } from "../primitives/Bytecode/index.js";
import { Chain } from "../primitives/Chain/index.js";
import { Opcode } from "../primitives/Opcode/index.js";
import { BloomFilter } from "../primitives/BloomFilter/index.js";
import { Siwe } from "../primitives/Siwe/index.js";
import { Bytes } from "../primitives/Bytes/Bytes.js";
import { Bytes32 } from "../primitives/Bytes/Bytes32/index.js";
import { StorageKey } from "../primitives/State/index.js";
import { Wei, Gwei, Ether } from "../primitives/Denomination/index.js";
// Crypto imports - use JS Keccak256 for type assertion (native is async)
import { Keccak256 as Keccak256JS } from "../crypto/Keccak256/index.js";
import { Secp256k1 } from "../crypto/Secp256k1/index.js";
import { SHA256 } from "../crypto/SHA256/index.js";
import { Blake2 } from "../crypto/Blake2/index.js";
import { Ripemd160 } from "../crypto/Ripemd160/index.js";
import { Ed25519 } from "../crypto/Ed25519/index.js";
import { P256 } from "../crypto/P256/index.js";
import { X25519 } from "../crypto/X25519/X25519.js";
import { BN254 } from "../crypto/bn254/BN254.js";
import { Bls12381 } from "../crypto/Bls12381/Bls12381.js";
import { KZG } from "../crypto/KZG/index.js";
import { EIP712 } from "../crypto/EIP712/index.js";
import { ModExp } from "../crypto/ModExp/index.js";
/**
 * Native API object - satisfies VoltaireAPI interface
 * This ensures compile-time errors if the native API doesn't have all required namespaces.
 *
 * Note: The actual Keccak256 export is the native async version from Keccak256.native.js,
 * but we use JS Keccak256 here for type checking since native methods are async.
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
    // Crypto (using JS for type check, actual export is native async Keccak256)
    Keccak256: Keccak256JS,
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
};
// Export the API object for programmatic access (with JS Keccak256 for sync API)
export { _nativeAPI as nativeAPI };
// ============================================================================
// Streaming primitives (pure JS - same as main entrypoint)
// ============================================================================
export * as block from "../block/index.js";
export * as contract from "../contract/index.js";
export * as transaction from "../transaction/index.js";
export * as stream from "../stream/index.js";
// ============================================================================
// Wallet utilities (native-only hardware wallets)
// ============================================================================
export * as wallet from "../wallet/index.js";
