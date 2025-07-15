// ABI encoding and decoding functionality
// Re-exports from the ABI module

pub const mod = @import("abi_encoding.zig");

// Re-export main types and functions
pub const AbiType = mod.AbiType;
pub const AbiValue = mod.AbiValue;
pub const AbiError = mod.AbiError;
pub const Selector = mod.Selector;
pub const Address = mod.Address;
pub const Hash = mod.Hash;
pub const FunctionDefinition = mod.FunctionDefinition;
pub const StateMutability = mod.StateMutability;
pub const CommonSelectors = mod.CommonSelectors;
pub const CommonPatterns = mod.CommonPatterns;

// Helper functions
pub const uint256_value = mod.uint256_value;
pub const bool_value = mod.bool_value;
pub const address_value = mod.address_value;
pub const string_value = mod.string_value;
pub const bytes_value = mod.bytes_value;

// Core encoding functions
pub const encode_abi_parameters = mod.encode_abi_parameters;
pub const encode_function_data = mod.encode_function_data;
pub const encode_event_topics = mod.encode_event_topics;
pub const encode_packed = mod.encode_packed;

// Core decoding functions
pub const decode_abi_parameters = mod.decode_abi_parameters;
pub const decode_function_data = mod.decode_function_data;

// Utility functions
pub const compute_selector = mod.compute_selector;
pub const create_function_signature = mod.create_function_signature;
pub const estimate_gas_for_data = mod.estimate_gas_for_data;
