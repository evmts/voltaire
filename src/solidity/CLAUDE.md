# CLAUDE.md - Solidity Module AI Context

## MISSION CRITICAL: Solidity Integration and ABI Handling

The Solidity module provides integration with Solidity compiler output and ABI handling. **ANY error in ABI encoding/decoding can cause incorrect contract interactions and fund loss.** Solidity integration must handle all compiler versions and ABI formats correctly.

## Critical Implementation Details

### ABI (Application Binary Interface) Handling
- **Function Signature Encoding**: 4-byte function selectors (keccak256 hash)
- **Parameter Encoding**: Solidity ABI encoding specification
- **Event Log Decoding**: Parse contract events from transaction logs
- **Error Handling**: Decode revert reasons and custom errors
- **Type Mapping**: Convert between Solidity and EVM types

### Key Responsibilities
- **Contract Compilation**: Interface with Solidity compiler
- **ABI Generation**: Generate interface definitions from source
- **Bytecode Analysis**: Analyze Solidity compiler output
- **Debug Information**: Map EVM execution to Solidity source
- **Type Safety**: Ensure type-safe contract interactions

### Critical ABI Operations
```zig
// Function call encoding
pub fn encode_function_call(
    function_signature: []const u8,
    params: []const AbiValue,
) ![]u8 {
    const selector = keccak256(function_signature)[0..4];
    const encoded_params = try abi.encode(params);

    var result = try allocator.alloc(u8, 4 + encoded_params.len);
    @memcpy(result[0..4], selector);
    @memcpy(result[4..], encoded_params);
    return result;
}

// Event log decoding
pub fn decode_event_log(
    log: *const EventLog,
    event_abi: *const EventAbi,
) !DecodedEvent {
    const signature_hash = log.topics[0];
    if (!std.mem.eql(u8, &signature_hash, &event_abi.signature_hash)) {
        return AbiError.SignatureMismatch;
    }

    return abi.decode_event(log.data, log.topics[1..], event_abi);
}
```

### Solidity Version Compatibility
- **Compiler Version Detection**: Identify Solidity version from metadata
- **ABI Format Evolution**: Handle different ABI JSON formats
- **Breaking Changes**: Account for Solidity compiler breaking changes
- **Optimization Settings**: Handle different compiler optimization levels

### Type System Mapping
- **Elementary Types**: uint, int, bool, address, bytes
- **Complex Types**: arrays, structs, mappings (storage layout)
- **Dynamic Types**: string, bytes, dynamic arrays
- **Fixed Types**: fixed-point numbers (when supported)
- **User-Defined Types**: enums, structs, contracts

### Critical Safety Requirements
- Validate all ABI data before decoding
- Handle malformed or truncated ABI data gracefully
- Ensure type safety in all conversions
- Validate function signatures match expected interfaces
- Prevent buffer overflows in ABI encoding/decoding

### Debug Integration
- **Source Mapping**: Map EVM PC to Solidity source lines
- **Variable Inspection**: Access Solidity variable values during execution
- **Call Stack**: Provide Solidity-level call stack information
- **Coverage Analysis**: Track Solidity code coverage during execution

### Performance Optimization
- Cache compiled contract artifacts
- Optimize ABI encoding/decoding for common types
- Precompile function signatures for frequent calls
- Batch ABI operations where possible

### Testing Requirements
- Test with all supported Solidity compiler versions
- Validate ABI encoding/decoding round trips
- Test edge cases in type handling
- Cross-reference with official Solidity ABI specification
- Fuzz test with malformed ABI data

### Emergency Procedures
- Handle Solidity compiler bugs and workarounds
- Detect and report ABI compatibility issues
- Fallback mechanisms for unsupported features
- Safe degradation for corrupted contract metadata

Remember: **ABI compatibility affects all smart contract interactions.** Any error in ABI handling can break contract calls, event parsing, or debug information, potentially leading to financial losses or system failures.