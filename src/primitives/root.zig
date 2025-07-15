pub const Address = @import("Address");
pub const Hash = @import("hash.zig");
pub const Hex = @import("hex.zig");
pub const Numeric = @import("numeric.zig");
pub const Rlp = @import("Rlp");
pub const Abi = @import("abi.zig");
pub const FeeMarket = @import("fee_market.zig");
pub const StorageKey = @import("state/storage_key.zig");
pub const Crypto = @import("crypto.zig");
pub const HashAlgorithms = @import("hash_algorithms.zig");

// EIP-712 Typed Data Signing
pub const Eip712 = @import("eip712.zig");

// EIP-4844 KZG Cryptography
// Use real KZG for native builds, placeholder for WASM
pub const KZG = if (@import("builtin").target.cpu.arch == .wasm32)
    @import("kzg/kzg_placeholder.zig")
else
    @import("kzg/kzg.zig");
