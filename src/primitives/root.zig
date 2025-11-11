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
pub const Address = @import("Address/address.zig");

// Encoding/Decoding
pub const Hex = @import("Hex/Hex.zig");
pub const Rlp = @import("Rlp/Rlp.zig");
pub const Abi = @import("Abi/Abi.zig");
pub const AbiEncoding = @import("Abi/abi_encoding.zig");
pub const Base64 = @import("base64.zig");

// Utilities
pub const Numeric = @import("Uint/numeric.zig");
pub const GasConstants = @import("GasConstants/gas_constants.zig");
pub const Uint = @import("Uint/Uint.zig").Uint;
// Note: Zig 0.14 includes a builtin `u256` primitive. Avoid exporting
// a shadowing alias here to prevent name conflicts in tests/builds.

// Denominations
pub const Denomination = @import("Denomination/denomination.zig");
pub const Wei = Denomination.Wei;
pub const Gwei = Denomination.Gwei;
pub const Ether = Denomination.Ether;

// State management
pub const State = @import("State/state.zig");
pub const StorageKey = State.StorageKey;

// Transaction types
pub const Transaction = @import("Transaction/Transaction.zig");
pub const AccessList = @import("AccessList/access_list.zig");
pub const Authorization = @import("Authorization/authorization.zig");
pub const Blob = @import("Blob/blob.zig");

// Contract utilities
pub const EventLog = @import("EventLog/EventLog.zig");
pub const Bytecode = @import("Bytecode/bytecode.zig").Bytecode;

// Opcodes
pub const Opcode = @import("Opcode/opcode.zig").Opcode;
pub const OpcodeInfo = @import("Opcode/opcode_info.zig");

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

// Data structures
pub const Trie = @import("trie.zig").Trie;
pub const BloomFilter = @import("BloomFilter/bloom_filter.zig").BloomFilter;
pub const BinaryTree = @import("BinaryTree/binary_tree.zig");

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
