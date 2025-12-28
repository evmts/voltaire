//! Ethereum Primitives - Fundamental types and utilities for Ethereum development
//!
//! This module provides the core building blocks for Ethereum applications,
//! including address handling, cryptographic operations, data encoding,
//! transaction structures, and utility functions.
//!
//! ## Module Organization
//!
//! ### Core Types
//! - **Address**: Ethereum address utilities with checksum validation
//! - **Hash**: Cryptographic hash types and operations
//! - **Numeric**: Big integer arithmetic and conversions
//! - **Units**: Ether denomination utilities (wei, gwei, ether)
//!
//! ### Encoding & Serialization
//! - **Hex**: Hexadecimal encoding/decoding with validation
//! - **RLP**: Recursive Length Prefix encoding (Ethereum's serialization)
//! - **ABI**: Application Binary Interface encoding/decoding
//! - **AbiEncoding**: High-level ABI encoding utilities
//!
//! ### Cryptography
//! - **Crypto**: Core cryptographic functions (Keccak256, etc.)
//! - **secp256k1**: Elliptic curve operations for signatures
//! - **ModExp**: Modular exponentiation for precompiles
//! - **HashAlgorithms**: Various hash function implementations
//!
//! ### Transaction Support
//! - **Transaction**: All Ethereum transaction types (Legacy, EIP-1559, EIP-4844)
//! - **AccessList**: EIP-2930 access list support
//! - **Authorization**: EIP-7702 authorization lists
//! - **Blob**: EIP-4844 blob transaction data structures
//!
//! ### Bytecode & Execution
//! - **Bytecode**: EVM bytecode utilities with jump destination analysis
//! - **Opcode**: EVM opcode enumeration with utility methods
//! - **OpcodeInfo**: Gas costs and stack metadata for opcodes
//!
//! ### Ethereum Standards
//! - **EventLog**: Contract event log structures
//! - **Ens**: Ethereum Name Service normalization (ENSIP-15)
//! - **Siwe**: Sign-In with Ethereum message handling
//! - **EIP712**: Typed data signing standard
//!
//! ### Protocol
//! - **Hardfork**: Ethereum hardfork identifiers and version comparison
//! - **ForkTransition**: Fork transition parsing and activation logic
//!
//! ### State & Storage
//! - **State**: Account state and storage key definitions
//! - **GasConstants**: EVM gas cost constants
//! - **FeeMarket**: EIP-1559 fee market calculations
//!
//! ## Usage Examples
//!
//! ### Address Operations
//! ```zig
//! const primitives = @import("primitives");
//!
//! // Create address from hex string
//! const addr = primitives.Address.fromHex("0x742d35Cc6641C91B6E...d");
//!
//! // Generate contract address
//! const contract_addr = primitives.Address.get_contract_address(deployer, nonce);
//! ```
//!
//! ### Transaction Handling
//! ```zig
//! // Create EIP-1559 transaction
//! const tx = primitives.Transaction.Eip1559Transaction{
//!     .chain_id = 1,
//!     .nonce = 42,
//!     .max_fee_per_gas = 20_000_000_000, // 20 gwei
//!     // ... other fields
//! };
//! ```
//!
//! ### Cryptographic Operations
//! ```zig
//! // Hash data with Keccak256
//! const hash = primitives.Crypto.keccak256(data);
//!
//! // Verify signature
//! const valid = try primitives.secp256k1.verify(signature, message_hash, public_key);
//! ```
//!
//! ### Data Encoding
//! ```zig
//! // RLP encode a list
//! const encoded = try primitives.Rlp.encode(allocator, data);
//! defer allocator.free(encoded);
//!
//! // Hex encode bytes
//! const hex_string = primitives.Hex.encode(bytes);
//! ```
//!
//! ## Design Principles
//!
//! 1. **Type Safety**: Strong typing prevents common bugs
//! 2. **Memory Efficiency**: Minimal allocations with clear ownership
//! 3. **Standard Compliance**: Adherence to Ethereum specifications
//! 4. **Performance**: Optimized implementations for critical paths
//! 5. **Testability**: Comprehensive test coverage for all operations

// Core types
pub const AccountState = @import("AccountState/AccountState.zig");
pub const Address = @import("Address/address.zig");
pub const BeaconBlockRoot = @import("BeaconBlockRoot/BeaconBlockRoot.zig");
pub const Block = @import("Block/Block.zig");
pub const BlockBody = @import("BlockBody/BlockBody.zig");
pub const BlockHash = @import("BlockHash/BlockHash.zig");
pub const BlockHeader = @import("BlockHeader/BlockHeader.zig");
pub const BlockNumber = @import("BlockNumber/BlockNumber.zig");
pub const Bytes = @import("Bytes/Bytes.zig");
pub const Bytes32 = @import("Bytes32/Bytes32.zig");
pub const ChainId = @import("ChainId/ChainId.zig");
pub const Epoch = @import("Epoch/Epoch.zig");
pub const Hash = @import("Hash/Hash.zig");
pub const LogIndex = @import("LogIndex/LogIndex.zig");
pub const Nonce = @import("Nonce/Nonce.zig");
pub const PrivateKey = @import("PrivateKey/PrivateKey.zig");
pub const PublicKey = @import("PublicKey/PublicKey.zig");
pub const Signature = @import("Signature/Signature.zig").Signature;
pub const Slot = @import("Slot/Slot.zig");
pub const StateRoot = @import("StateRoot/StateRoot.zig");
pub const StorageValue = @import("StorageValue/StorageValue.zig");
pub const TransactionHash = @import("TransactionHash/TransactionHash.zig");

// Filter types
pub const FilterId = @import("FilterId/filter_id.zig");
pub const BlockFilter = @import("BlockFilter/block_filter.zig");
pub const TopicFilter = @import("TopicFilter/topic_filter.zig");
pub const PendingTransactionFilter = @import("PendingTransactionFilter/pending_transaction_filter.zig");

// Proof types (EIP-1186)
pub const Proof = @import("Proof/proof.zig");
pub const StorageProof = @import("StorageProof/storage_proof.zig");
pub const StateProof = @import("StateProof/state_proof.zig");
pub const TransactionIndex = @import("TransactionIndex/TransactionIndex.zig");
pub const ValidatorIndex = @import("ValidatorIndex/ValidatorIndex.zig");
pub const WithdrawalIndex = @import("WithdrawalIndex/WithdrawalIndex.zig");

// EIP-712 / EIP-2124 types
pub const Domain = @import("Domain/Domain.zig").Domain;
pub const DomainSeparator = @import("DomainSeparator/DomainSeparator.zig").DomainSeparator;
pub const TypedData = @import("TypedData/TypedData.zig");
pub const ForkId = @import("ForkId/ForkId.zig").ForkId;
pub const Withdrawal = @import("Withdrawal/Withdrawal.zig").Withdrawal;

// Encoding/Decoding
pub const Hex = @import("Hex/Hex.zig");
pub const Rlp = @import("Rlp/Rlp.zig");
pub const Abi = @import("Abi/Abi.zig");
pub const AbiEncoding = @import("Abi/abi_encoding.zig");
pub const Base64 = @import("base64.zig");
pub const Ssz = @import("Ssz/root.zig");

// Utilities
pub const Numeric = @import("Uint/numeric.zig");
pub const GasConstants = @import("GasConstants/gas_constants.zig");
pub const Gas = @import("Gas/Gas.zig");
pub const GasEstimate = @import("GasEstimate/gas_estimate.zig").GasEstimate;
pub const GasUsed = @import("GasUsed/gas_used.zig").GasUsed;
pub const GasRefund = @import("GasRefund/gas_refund.zig").GasRefund;
pub const GasCosts = @import("GasCosts/gas_costs.zig");
pub const Uint = @import("Uint/Uint.zig").Uint;
// Note: Zig 0.14 includes a builtin `u256` primitive. Avoid exporting
// a shadowing alias here to prevent name conflicts in tests/builds.

// Fixed-width unsigned integer types (branded wrappers)
pub const Uint8 = @import("uint8.zig").Uint8;
pub const Uint16 = @import("uint16.zig").Uint16;
pub const Uint32 = @import("uint32.zig").Uint32;
pub const Uint64 = @import("uint64.zig").Uint64;
pub const Uint128 = @import("uint128.zig").Uint128;

// Fixed-width signed integer types (branded wrappers)
pub const Int8 = @import("Int8/int8.zig");
pub const Int16 = @import("Int16/int16.zig");
pub const Int32 = @import("Int32/int32.zig");
pub const Int64 = @import("Int64/int64.zig");
pub const Int128 = @import("Int128/int128.zig");

// EIP-1559 Fee Types
pub const BaseFeePerGas = @import("BaseFeePerGas/BaseFeePerGas.zig").BaseFeePerGas;
pub const MaxFeePerGas = @import("MaxFeePerGas/MaxFeePerGas.zig").MaxFeePerGas;
pub const MaxPriorityFeePerGas = @import("MaxPriorityFeePerGas/MaxPriorityFeePerGas.zig").MaxPriorityFeePerGas;
pub const EffectiveGasPrice = @import("EffectiveGasPrice/EffectiveGasPrice.zig").EffectiveGasPrice;
pub const GasPrice = @import("GasPrice/GasPrice.zig").GasPrice;
pub const FeeMarket = @import("FeeMarket/fee_market.zig");

// Denominations
pub const Denomination = @import("Denomination/denomination.zig");
pub const Wei = Denomination.Wei;
pub const Gwei = Denomination.Gwei;
pub const Ether = Denomination.Ether;
pub const WEI_PER_GWEI = Denomination.WEI_PER_GWEI;
pub const WEI_PER_ETHER = Denomination.WEI_PER_ETHER;
pub const GWEI_PER_ETHER = Denomination.GWEI_PER_ETHER;

// State management
pub const State = @import("State/state.zig");
pub const StorageKey = State.StorageKey;
pub const Storage = @import("Storage/storage.zig");

// Proxy utilities
pub const Proxy = @import("Proxy/erc1167.zig");

// Transaction types
pub const Transaction = @import("Transaction/Transaction.zig");
pub const AccessList = @import("AccessList/access_list.zig");
pub const Authorization = @import("Authorization/authorization.zig");
pub const Blob = @import("Blob/blob.zig");

// ERC-4337 Account Abstraction
pub const UserOperation = @import("UserOperation/user_operation.zig");
pub const EntryPoint = @import("EntryPoint/entry_point.zig");
pub const Bundler = @import("Bundler/Bundler.zig");

// MEV/Flashbots
pub const Bundle = @import("Bundle/Bundle.zig");
pub const BundleHash = @import("BundleHash/BundleHash.zig");

// Transaction utilities
pub const TransactionStatus = @import("TransactionStatus/TransactionStatus.zig");
pub const TransactionUrl = @import("TransactionUrl/TransactionUrl.zig");

// Contract utilities
pub const EventLog = @import("EventLog/EventLog.zig");
pub const Receipt = @import("Receipt/Receipt.zig");
pub const Bytecode = @import("Bytecode/bytecode.zig").Bytecode;

// Code types
pub const ContractCode = @import("ContractCode/contract_code.zig").ContractCode;
pub const RuntimeCode = @import("RuntimeCode/runtime_code.zig").RuntimeCode;
pub const InitCode = @import("InitCode/init_code.zig").InitCode;
pub const ReturnData = @import("ReturnData/return_data.zig").ReturnData;
pub const RevertReason = @import("RevertReason/revert_reason.zig");

// Data encoding primitives
pub const CallData = @import("CallData/call_data.zig");
pub const EncodedData = @import("EncodedData/encoded_data.zig");
pub const DecodedData = @import("DecodedData/decoded_data.zig");
pub const SignedData = @import("SignedData/signed_data.zig");
pub const ContractResult = @import("ContractResult/contract_result.zig");

// Opcodes
pub const Opcode = @import("Opcode/opcode.zig").Opcode;
pub const OpcodeInfo = @import("Opcode/opcode_info.zig");

// ABI Signatures
pub const Selector = @import("Selector/Selector.zig");
pub const FunctionSignature = @import("FunctionSignature/function_signature.zig");
pub const EventSignature = @import("EventSignature/event_signature.zig");
pub const ErrorSignature = @import("ErrorSignature/error_signature.zig");
pub const ContractSignature = @import("ContractSignature/contract_signature.zig");

// Logging
pub const logs = @import("EventLog/logs.zig");

// Standards
pub const Siwe = @import("Siwe/siwe.zig");
pub const Ens = @import("Ens/ens.zig");

// Protocol
pub const Hardfork = @import("Hardfork/hardfork.zig").Hardfork;
pub const ForkTransition = @import("Hardfork/hardfork.zig").ForkTransition;
pub const Eips = @import("Hardfork/Eips.zig").Eips;
pub const EipOverride = @import("Hardfork/Eips.zig").EipOverride;

// Network primitives
pub const NetworkId = @import("NetworkId/NetworkId.zig");
pub const PeerId = @import("PeerId/PeerId.zig");
pub const PeerInfo = @import("PeerInfo/PeerInfo.zig");
pub const NodeInfo = @import("NodeInfo/NodeInfo.zig");
pub const ProtocolVersion = @import("ProtocolVersion/ProtocolVersion.zig");
pub const SyncStatus = @import("SyncStatus/SyncStatus.zig");

// Chain & Block primitives
pub const Chain = @import("Chain/chain.zig");
pub const ChainHead = @import("ChainHead/chain_head.zig");
pub const Uncle = @import("Uncle/uncle.zig");

// MEV/PBS primitives
pub const BuilderBid = @import("BuilderBid/builder_bid.zig");
pub const RelayData = @import("RelayData/relay_data.zig");

// EIP-2771 Meta-Transaction
pub const ForwardRequest = @import("ForwardRequest/forward_request.zig");

// Contract metadata primitives
pub const Metadata = @import("Metadata/metadata.zig");
pub const License = @import("License/license.zig");
pub const CompilerVersion = @import("CompilerVersion/compiler_version.zig");

// State diff primitives
pub const StateDiff = @import("StateDiff/state_diff.zig");
pub const StorageDiff = @import("StorageDiff/storage_diff.zig");

// Token primitives
pub const TokenId = @import("TokenId/TokenId.zig");
pub const MultiTokenId = @import("MultiTokenId/MultiTokenId.zig");
pub const TokenBalance = @import("TokenBalance/TokenBalance.zig");
pub const Permit = @import("Permit/Permit.zig");
pub const StealthAddress = @import("StealthAddress/StealthAddress.zig");

// Data structures
pub const Trie = @import("trie.zig").Trie;
pub const BloomFilter = @import("BloomFilter/bloom_filter.zig").BloomFilter;
pub const BinaryTree = @import("BinaryTree/binary_tree.zig");

// Trace & Debug primitives
pub const StructLog = @import("StructLog/struct_log.zig").StructLog;
pub const OpStep = @import("OpStep/op_step.zig").OpStep;
pub const CallTrace = @import("CallTrace/call_trace.zig").CallTrace;
pub const CallType = @import("CallTrace/call_trace.zig").CallType;
pub const TraceConfig = @import("TraceConfig/trace_config.zig").TraceConfig;
pub const TraceResult = @import("TraceResult/trace_result.zig").TraceResult;
pub const MemoryDump = @import("MemoryDump/memory_dump.zig").MemoryDump;
pub const SourceMap = @import("SourceMap/source_map.zig").SourceMap;
pub const SourceMapEntry = @import("SourceMap/source_map.zig").SourceMapEntry;
pub const JumpType = @import("SourceMap/source_map.zig").JumpType;

// Export common constants
pub const ZERO_ADDRESS = Address.ZERO_ADDRESS;
pub const EMPTY_CODE_HASH = State.EMPTY_CODE_HASH;
pub const EMPTY_TRIE_ROOT = State.EMPTY_TRIE_ROOT;

// Expose crypto package for primitives submodules that need hashing
// Enables imports via `@import("root").crypto` within this package
pub const crypto = @import("crypto");

// Fuzz tests are standalone and run with: zig build test --fuzz
// They use std.testing.fuzzInput which only exists in fuzz mode
// Files: Address/address.fuzz.zig, Abi/Abi.fuzz.zig, Hex/hex.fuzz.zig, etc.

// Note: extra tests are compiled via a separate test runner (see build.zig)
