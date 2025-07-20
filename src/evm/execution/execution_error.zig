const std = @import("std");

/// ExecutionError represents various error conditions that can occur during EVM execution
///
/// This module defines all possible error conditions that can occur during the execution
/// of EVM bytecode. These errors are used throughout the EVM implementation to signal
/// various failure conditions, from normal stops to critical errors.
///
/// ## Error Categories
///
/// The errors can be broadly categorized into:
///
/// 1. **Normal Termination**: STOP, REVERT, INVALID
/// 2. **Resource Exhaustion**: OutOfGas, StackOverflow, MemoryLimitExceeded
/// 3. **Invalid Operations**: InvalidJump, InvalidOpcode, StaticStateChange
/// 4. **Bounds Violations**: StackUnderflow, OutOfOffset, ReturnDataOutOfBounds
/// 5. **Contract Creation**: DeployCodeTooBig, MaxCodeSizeExceeded, InvalidCodeEntry
/// 6. **Call Stack**: DepthLimit
/// 7. **Memory Management**: OutOfMemory, InvalidOffset, InvalidSize, ChildContextActive
/// 8. **Future Features**: EOFNotSupported
const ExecutionError = @This();

/// Error types for EVM execution
///
/// Each error represents a specific condition that can occur during EVM execution.
/// Some errors (like STOP and REVERT) are normal termination conditions, while
/// others represent actual failure states.
pub const Error = error{
    /// Normal termination via STOP opcode (0x00)
    /// This is not an error condition - it signals successful completion
    STOP,

    /// State reversion via REVERT opcode (0xFD)
    /// Returns data and reverts all state changes in the current context
    REVERT,

    /// Execution of INVALID opcode (0xFE)
    /// Consumes all remaining gas and reverts state
    INVALID,

    /// Insufficient gas to complete operation
    /// Occurs when gas_remaining < gas_required for any operation
    OutOfGas,

    /// Attempted to pop from empty stack or insufficient stack items
    /// Stack operations require specific minimum stack sizes
    StackUnderflow,

    /// Stack size exceeded maximum of 1024 elements
    /// Pushing to a full stack causes this error
    StackOverflow,

    /// JUMP/JUMPI to invalid destination
    /// Destination must be a JUMPDEST opcode at a valid position
    InvalidJump,

    /// Attempted to execute undefined opcode
    /// Not all byte values 0x00-0xFF are defined opcodes
    InvalidOpcode,

    /// Attempted state modification in static call context
    /// SSTORE, LOG*, CREATE*, and SELFDESTRUCT are forbidden in static calls
    StaticStateChange,

    /// Memory or calldata access beyond valid bounds
    /// Usually from integer overflow in offset calculations
    OutOfOffset,

    /// Gas calculation resulted in integer overflow
    /// Can occur with extremely large memory expansions
    GasUintOverflow,

    /// Attempted write in read-only context
    /// Similar to StaticStateChange but more general
    WriteProtection,

    /// RETURNDATACOPY accessing data beyond RETURNDATASIZE
    /// Unlike other copy operations, this is a hard error
    ReturnDataOutOfBounds,

    /// Invalid access to return data buffer
    /// Occurs when RETURNDATACOPY offset + size > return data size
    InvalidReturnDataAccess,

    /// Contract deployment code exceeds maximum size
    /// Deployment bytecode has its own size limits
    DeployCodeTooBig,

    /// Deployed contract code exceeds 24,576 byte limit (EIP-170)
    /// Prevents storing excessively large contracts
    MaxCodeSizeExceeded,

    /// Invalid contract initialization code
    /// Can occur with malformed constructor bytecode
    InvalidCodeEntry,

    /// Call stack depth exceeded 1024 levels
    /// Prevents infinite recursion and stack overflow attacks
    DepthLimit,

    /// Memory allocation failed (host environment issue)
    /// Not a normal EVM error - indicates system resource exhaustion
    OutOfMemory,

    /// Invalid memory offset in operation
    /// Usually from malformed offset values
    InvalidOffset,

    /// Invalid memory size in operation
    /// Usually from malformed size values
    InvalidSize,

    /// Memory expansion would exceed configured limits
    /// Prevents excessive memory usage (typically 32MB limit)
    MemoryLimitExceeded,

    /// Attempted operation while child memory context is active
    /// Memory contexts must be properly managed
    ChildContextActive,

    /// Attempted to revert/commit without active child context
    /// Memory context operations must be balanced
    NoChildContextToRevertOrCommit,

    /// EOF (EVM Object Format) features not yet implemented
    /// Placeholder for future EOF-related opcodes
    EOFNotSupported,

    // Database errors from the database interface
    /// Account not found in the database
    AccountNotFound,
    /// Storage slot not found for the given address
    StorageNotFound,
    /// Contract code not found for the given hash
    CodeNotFound,
    /// Invalid address format
    InvalidAddress,
    /// Database corruption detected
    DatabaseCorrupted,
    /// Network error when accessing remote database
    NetworkError,
    /// Permission denied accessing database
    PermissionDenied,
    /// Invalid snapshot identifier
    InvalidSnapshot,
    /// Batch operation not in progress
    NoBatchInProgress,
    /// Snapshot not found
    SnapshotNotFound,
};

/// Get a human-readable description for an execution error
///
/// Provides detailed descriptions of what each error means and when it occurs.
/// Useful for debugging, logging, and error reporting.
///
/// ## Parameters
/// - `err`: The execution error to describe
///
/// ## Returns
/// A string slice containing a human-readable description of the error
///
/// ## Example
/// ```zig
/// const err = Error.StackOverflow;
/// const desc = get_description(err);
/// std.log.err("EVM execution failed: {s}", .{desc});
/// ```
pub fn get_description(err: Error) []const u8 {
    return switch (err) {
        Error.STOP => "Normal STOP opcode execution",
        Error.REVERT => "REVERT opcode - state reverted",
        Error.INVALID => "INVALID opcode or invalid operation",
        Error.OutOfGas => "Out of gas",
        Error.StackUnderflow => "Stack underflow",
        Error.StackOverflow => "Stack overflow (beyond 1024 elements)",
        Error.InvalidJump => "Jump to invalid destination",
        Error.InvalidOpcode => "Undefined opcode",
        Error.StaticStateChange => "State modification in static context",
        Error.OutOfOffset => "Memory access out of bounds",
        Error.GasUintOverflow => "Gas calculation overflow",
        Error.WriteProtection => "Write to protected storage",
        Error.ReturnDataOutOfBounds => "Return data access out of bounds",
        Error.InvalidReturnDataAccess => "Invalid return data access - offset + size exceeds data length",
        Error.DeployCodeTooBig => "Contract creation code too large",
        Error.MaxCodeSizeExceeded => "Contract code size exceeds limit",
        Error.InvalidCodeEntry => "Invalid contract entry code",
        Error.DepthLimit => "Call depth exceeds limit (1024)",
        Error.OutOfMemory => "Out of memory allocation failed",
        Error.InvalidOffset => "Invalid memory offset",
        Error.InvalidSize => "Invalid memory size",
        Error.MemoryLimitExceeded => "Memory limit exceeded",
        Error.ChildContextActive => "Child context is active",
        Error.NoChildContextToRevertOrCommit => "No child context to revert or commit",
        Error.EOFNotSupported => "EOF (EVM Object Format) opcode not supported",
        Error.AccountNotFound => "Account not found in database",
        Error.StorageNotFound => "Storage slot not found in database",
        Error.CodeNotFound => "Contract code not found in database",
        Error.InvalidAddress => "Invalid address format",
        Error.DatabaseCorrupted => "Database corruption detected",
        Error.NetworkError => "Network error accessing database",
        Error.PermissionDenied => "Permission denied accessing database",
        Error.InvalidSnapshot => "Invalid snapshot identifier",
        Error.NoBatchInProgress => "No batch operation in progress",
        Error.SnapshotNotFound => "Snapshot not found in database",
    };
}

// Tests

const testing = std.testing;

test "get_description returns correct message for STOP error" {
    const desc = get_description(Error.STOP);
    try testing.expectEqualStrings("Normal STOP opcode execution", desc);
}

test "get_description returns correct message for REVERT error" {
    const desc = get_description(Error.REVERT);
    try testing.expectEqualStrings("REVERT opcode - state reverted", desc);
}

test "get_description returns correct message for INVALID error" {
    const desc = get_description(Error.INVALID);
    try testing.expectEqualStrings("INVALID opcode or invalid operation", desc);
}

test "get_description returns correct message for OutOfGas error" {
    const desc = get_description(Error.OutOfGas);
    try testing.expectEqualStrings("Out of gas", desc);
}

test "get_description returns correct message for StackUnderflow error" {
    const desc = get_description(Error.StackUnderflow);
    try testing.expectEqualStrings("Stack underflow", desc);
}

test "get_description returns correct message for StackOverflow error" {
    const desc = get_description(Error.StackOverflow);
    try testing.expectEqualStrings("Stack overflow (beyond 1024 elements)", desc);
}

test "get_description returns correct message for InvalidJump error" {
    const desc = get_description(Error.InvalidJump);
    try testing.expectEqualStrings("Jump to invalid destination", desc);
}

test "get_description returns correct message for InvalidOpcode error" {
    const desc = get_description(Error.InvalidOpcode);
    try testing.expectEqualStrings("Undefined opcode", desc);
}

test "get_description returns correct message for StaticStateChange error" {
    const desc = get_description(Error.StaticStateChange);
    try testing.expectEqualStrings("State modification in static context", desc);
}

test "get_description returns correct message for OutOfOffset error" {
    const desc = get_description(Error.OutOfOffset);
    try testing.expectEqualStrings("Memory access out of bounds", desc);
}

test "get_description returns correct message for GasUintOverflow error" {
    const desc = get_description(Error.GasUintOverflow);
    try testing.expectEqualStrings("Gas calculation overflow", desc);
}

test "get_description returns correct message for WriteProtection error" {
    const desc = get_description(Error.WriteProtection);
    try testing.expectEqualStrings("Write to protected storage", desc);
}

test "get_description returns correct message for ReturnDataOutOfBounds error" {
    const desc = get_description(Error.ReturnDataOutOfBounds);
    try testing.expectEqualStrings("Return data access out of bounds", desc);
}

test "get_description returns correct message for InvalidReturnDataAccess error" {
    const desc = get_description(Error.InvalidReturnDataAccess);
    try testing.expectEqualStrings("Invalid return data access - offset + size exceeds data length", desc);
}

test "get_description returns correct message for DeployCodeTooBig error" {
    const desc = get_description(Error.DeployCodeTooBig);
    try testing.expectEqualStrings("Contract creation code too large", desc);
}

test "get_description returns correct message for MaxCodeSizeExceeded error" {
    const desc = get_description(Error.MaxCodeSizeExceeded);
    try testing.expectEqualStrings("Contract code size exceeds limit", desc);
}

test "get_description returns correct message for InvalidCodeEntry error" {
    const desc = get_description(Error.InvalidCodeEntry);
    try testing.expectEqualStrings("Invalid contract entry code", desc);
}

test "get_description returns correct message for DepthLimit error" {
    const desc = get_description(Error.DepthLimit);
    try testing.expectEqualStrings("Call depth exceeds limit (1024)", desc);
}

test "get_description returns correct message for OutOfMemory error" {
    const desc = get_description(Error.OutOfMemory);
    try testing.expectEqualStrings("Out of memory allocation failed", desc);
}

test "get_description returns correct message for InvalidOffset error" {
    const desc = get_description(Error.InvalidOffset);
    try testing.expectEqualStrings("Invalid memory offset", desc);
}

test "get_description returns correct message for InvalidSize error" {
    const desc = get_description(Error.InvalidSize);
    try testing.expectEqualStrings("Invalid memory size", desc);
}

test "get_description returns correct message for MemoryLimitExceeded error" {
    const desc = get_description(Error.MemoryLimitExceeded);
    try testing.expectEqualStrings("Memory limit exceeded", desc);
}

test "get_description returns correct message for ChildContextActive error" {
    const desc = get_description(Error.ChildContextActive);
    try testing.expectEqualStrings("Child context is active", desc);
}

test "get_description returns correct message for NoChildContextToRevertOrCommit error" {
    const desc = get_description(Error.NoChildContextToRevertOrCommit);
    try testing.expectEqualStrings("No child context to revert or commit", desc);
}

test "get_description returns correct message for EOFNotSupported error" {
    const desc = get_description(Error.EOFNotSupported);
    try testing.expectEqualStrings("EOF (EVM Object Format) opcode not supported", desc);
}

test "get_description returns correct message for AccountNotFound error" {
    const desc = get_description(Error.AccountNotFound);
    try testing.expectEqualStrings("Account not found in database", desc);
}

test "get_description returns correct message for StorageNotFound error" {
    const desc = get_description(Error.StorageNotFound);
    try testing.expectEqualStrings("Storage slot not found in database", desc);
}

test "get_description returns correct message for CodeNotFound error" {
    const desc = get_description(Error.CodeNotFound);
    try testing.expectEqualStrings("Contract code not found in database", desc);
}

test "get_description returns correct message for InvalidAddress error" {
    const desc = get_description(Error.InvalidAddress);
    try testing.expectEqualStrings("Invalid address format", desc);
}

test "get_description returns correct message for DatabaseCorrupted error" {
    const desc = get_description(Error.DatabaseCorrupted);
    try testing.expectEqualStrings("Database corruption detected", desc);
}

test "get_description returns correct message for NetworkError error" {
    const desc = get_description(Error.NetworkError);
    try testing.expectEqualStrings("Network error accessing database", desc);
}

test "get_description returns correct message for PermissionDenied error" {
    const desc = get_description(Error.PermissionDenied);
    try testing.expectEqualStrings("Permission denied accessing database", desc);
}

test "get_description returns correct message for InvalidSnapshot error" {
    const desc = get_description(Error.InvalidSnapshot);
    try testing.expectEqualStrings("Invalid snapshot identifier", desc);
}

test "get_description returns correct message for NoBatchInProgress error" {
    const desc = get_description(Error.NoBatchInProgress);
    try testing.expectEqualStrings("No batch operation in progress", desc);
}

test "get_description returns correct message for SnapshotNotFound error" {
    const desc = get_description(Error.SnapshotNotFound);
    try testing.expectEqualStrings("Snapshot not found in database", desc);
}

test "get_description consistency - all errors have non-empty descriptions" {
    const all_errors = [_]Error{
        Error.STOP, Error.REVERT, Error.INVALID, Error.OutOfGas,
        Error.StackUnderflow, Error.StackOverflow, Error.InvalidJump, Error.InvalidOpcode,
        Error.StaticStateChange, Error.OutOfOffset, Error.GasUintOverflow, Error.WriteProtection,
        Error.ReturnDataOutOfBounds, Error.InvalidReturnDataAccess, Error.DeployCodeTooBig,
        Error.MaxCodeSizeExceeded, Error.InvalidCodeEntry, Error.DepthLimit, Error.OutOfMemory,
        Error.InvalidOffset, Error.InvalidSize, Error.MemoryLimitExceeded, Error.ChildContextActive,
        Error.NoChildContextToRevertOrCommit, Error.EOFNotSupported, Error.AccountNotFound,
        Error.StorageNotFound, Error.CodeNotFound, Error.InvalidAddress, Error.DatabaseCorrupted,
        Error.NetworkError, Error.PermissionDenied, Error.InvalidSnapshot, Error.NoBatchInProgress,
        Error.SnapshotNotFound,
    };
    
    for (all_errors) |err| {
        const desc = get_description(err);
        try testing.expect(desc.len > 0);
    }
}

test "get_description formatting - descriptions are properly formatted" {
    const all_errors = [_]Error{
        Error.STOP, Error.REVERT, Error.INVALID, Error.OutOfGas,
        Error.StackUnderflow, Error.StackOverflow, Error.InvalidJump, Error.InvalidOpcode,
        Error.StaticStateChange, Error.OutOfOffset, Error.GasUintOverflow, Error.WriteProtection,
        Error.ReturnDataOutOfBounds, Error.InvalidReturnDataAccess, Error.DeployCodeTooBig,
        Error.MaxCodeSizeExceeded, Error.InvalidCodeEntry, Error.DepthLimit, Error.OutOfMemory,
        Error.InvalidOffset, Error.InvalidSize, Error.MemoryLimitExceeded, Error.ChildContextActive,
        Error.NoChildContextToRevertOrCommit, Error.EOFNotSupported, Error.AccountNotFound,
        Error.StorageNotFound, Error.CodeNotFound, Error.InvalidAddress, Error.DatabaseCorrupted,
        Error.NetworkError, Error.PermissionDenied, Error.InvalidSnapshot, Error.NoBatchInProgress,
        Error.SnapshotNotFound,
    };
    
    for (all_errors) |err| {
        const desc = get_description(err);
        try testing.expect(desc.len < 100);
        try testing.expect(!std.mem.startsWith(u8, desc, " "));
        try testing.expect(!std.mem.endsWith(u8, desc, " "));
    }
}

// ============================================================================
// Fuzz Tests for Error Enumeration Completeness (Issue #234)
// ============================================================================

test "fuzz_error_enumeration_completeness" {
    var prng = std.Random.DefaultPrng.init(0);
    const random = prng.random();
    
    const all_errors = [_]Error{
        Error.STOP, Error.REVERT, Error.INVALID, Error.OutOfGas,
        Error.StackUnderflow, Error.StackOverflow, Error.InvalidJump, Error.InvalidOpcode,
        Error.StaticStateChange, Error.OutOfOffset, Error.GasUintOverflow, Error.WriteProtection,
        Error.ReturnDataOutOfBounds, Error.InvalidReturnDataAccess, Error.DeployCodeTooBig,
        Error.MaxCodeSizeExceeded, Error.InvalidCodeEntry, Error.DepthLimit, Error.OutOfMemory,
        Error.InvalidOffset, Error.InvalidSize, Error.MemoryLimitExceeded, Error.ChildContextActive,
        Error.NoChildContextToRevertOrCommit, Error.EOFNotSupported, Error.AccountNotFound,
        Error.StorageNotFound, Error.CodeNotFound, Error.InvalidAddress, Error.DatabaseCorrupted,
        Error.NetworkError, Error.PermissionDenied, Error.InvalidSnapshot, Error.NoBatchInProgress,
        Error.SnapshotNotFound,
    };
    
    for (0..1000) |_| {
        const error_idx = random.intRangeLessThan(usize, 0, all_errors.len);
        const test_error = all_errors[error_idx];
        
        const desc = get_description(test_error);
        try testing.expect(desc.len > 0);
        try testing.expect(desc.len < 200);
        
        const has_proper_format = !std.mem.startsWith(u8, desc, " ") and !std.mem.endsWith(u8, desc, " ");
        try testing.expect(has_proper_format);
    }
}

test "fuzz_error_description_consistency" {
    var prng = std.Random.DefaultPrng.init(42);
    const random = prng.random();
    
    const all_errors = [_]Error{
        Error.STOP, Error.REVERT, Error.INVALID, Error.OutOfGas,
        Error.StackUnderflow, Error.StackOverflow, Error.InvalidJump, Error.InvalidOpcode,
        Error.StaticStateChange, Error.OutOfOffset, Error.GasUintOverflow, Error.WriteProtection,
        Error.ReturnDataOutOfBounds, Error.InvalidReturnDataAccess, Error.DeployCodeTooBig,
        Error.MaxCodeSizeExceeded, Error.InvalidCodeEntry, Error.DepthLimit, Error.OutOfMemory,
        Error.InvalidOffset, Error.InvalidSize, Error.MemoryLimitExceeded, Error.ChildContextActive,
        Error.NoChildContextToRevertOrCommit, Error.EOFNotSupported, Error.AccountNotFound,
        Error.StorageNotFound, Error.CodeNotFound, Error.InvalidAddress, Error.DatabaseCorrupted,
        Error.NetworkError, Error.PermissionDenied, Error.InvalidSnapshot, Error.NoBatchInProgress,
        Error.SnapshotNotFound,
    };
    
    var seen_descriptions = std.ArrayList([]const u8).init(testing.allocator);
    defer seen_descriptions.deinit();
    
    for (0..500) |_| {
        const error_idx = random.intRangeLessThan(usize, 0, all_errors.len);
        const test_error = all_errors[error_idx];
        const desc = get_description(test_error);
        
        var is_duplicate = false;
        for (seen_descriptions.items) |seen_desc| {
            if (std.mem.eql(u8, desc, seen_desc)) {
                is_duplicate = true;
                break;
            }
        }
        
        if (!is_duplicate) {
            try seen_descriptions.append(desc);
        }
        
        try testing.expect(desc.len >= 5);
        try testing.expect(desc.len <= 100);
    }
    
    try testing.expect(seen_descriptions.items.len >= 15);
}

test "fuzz_error_categorization_properties" {
    var prng = std.Random.DefaultPrng.init(123);
    const random = prng.random();
    
    const normal_termination = [_]Error{ Error.STOP, Error.REVERT, Error.INVALID };
    const resource_exhaustion = [_]Error{ Error.OutOfGas, Error.StackOverflow, Error.MemoryLimitExceeded, Error.OutOfMemory };
    const invalid_operations = [_]Error{ Error.InvalidJump, Error.InvalidOpcode, Error.StaticStateChange, Error.WriteProtection };
    const bounds_violations = [_]Error{ Error.StackUnderflow, Error.OutOfOffset, Error.ReturnDataOutOfBounds, Error.InvalidReturnDataAccess };
    
    for (0..200) |_| {
        const category = random.intRangeLessThan(u8, 0, 4);
        
        switch (category) {
            0 => {
                const idx = random.intRangeLessThan(usize, 0, normal_termination.len);
                const err = normal_termination[idx];
                const desc = get_description(err);
                
                const is_normal_termination = std.mem.containsAtLeast(u8, desc, 1, "opcode") or 
                                            std.mem.containsAtLeast(u8, desc, 1, "STOP") or
                                            std.mem.containsAtLeast(u8, desc, 1, "REVERT") or
                                            std.mem.containsAtLeast(u8, desc, 1, "INVALID");
                try testing.expect(is_normal_termination);
            },
            1 => {
                const idx = random.intRangeLessThan(usize, 0, resource_exhaustion.len);
                const err = resource_exhaustion[idx];
                const desc = get_description(err);
                
                const indicates_exhaustion = std.mem.containsAtLeast(u8, desc, 1, "out") or
                                           std.mem.containsAtLeast(u8, desc, 1, "overflow") or
                                           std.mem.containsAtLeast(u8, desc, 1, "exceeded") or
                                           std.mem.containsAtLeast(u8, desc, 1, "limit");
                try testing.expect(indicates_exhaustion);
            },
            2 => {
                const idx = random.intRangeLessThan(usize, 0, invalid_operations.len);
                const err = invalid_operations[idx];
                const desc = get_description(err);
                
                const indicates_invalid = std.mem.containsAtLeast(u8, desc, 1, "invalid") or
                                         std.mem.containsAtLeast(u8, desc, 1, "Invalid") or
                                         std.mem.containsAtLeast(u8, desc, 1, "static") or
                                         std.mem.containsAtLeast(u8, desc, 1, "protected");
                try testing.expect(indicates_invalid);
            },
            3 => {
                const idx = random.intRangeLessThan(usize, 0, bounds_violations.len);
                const err = bounds_violations[idx];
                const desc = get_description(err);
                
                const indicates_bounds = std.mem.containsAtLeast(u8, desc, 1, "underflow") or
                                        std.mem.containsAtLeast(u8, desc, 1, "bounds") or
                                        std.mem.containsAtLeast(u8, desc, 1, "out of") or
                                        std.mem.containsAtLeast(u8, desc, 1, "exceeds");
                try testing.expect(indicates_bounds);
            },
            else => unreachable,
        }
    }
}

test "fuzz_error_variant_instantiation" {
    var prng = std.Random.DefaultPrng.init(456);
    const random = prng.random();
    
    const all_errors = [_]Error{
        Error.STOP, Error.REVERT, Error.INVALID, Error.OutOfGas,
        Error.StackUnderflow, Error.StackOverflow, Error.InvalidJump, Error.InvalidOpcode,
        Error.StaticStateChange, Error.OutOfOffset, Error.GasUintOverflow, Error.WriteProtection,
        Error.ReturnDataOutOfBounds, Error.InvalidReturnDataAccess, Error.DeployCodeTooBig,
        Error.MaxCodeSizeExceeded, Error.InvalidCodeEntry, Error.DepthLimit, Error.OutOfMemory,
        Error.InvalidOffset, Error.InvalidSize, Error.MemoryLimitExceeded, Error.ChildContextActive,
        Error.NoChildContextToRevertOrCommit, Error.EOFNotSupported, Error.AccountNotFound,
        Error.StorageNotFound, Error.CodeNotFound, Error.InvalidAddress, Error.DatabaseCorrupted,
        Error.NetworkError, Error.PermissionDenied, Error.InvalidSnapshot, Error.NoBatchInProgress,
        Error.SnapshotNotFound,
    };
    
    for (0..300) |_| {
        const error_idx = random.intRangeLessThan(usize, 0, all_errors.len);
        const test_error = all_errors[error_idx];
        
        const result: anyerror!void = test_error;
        try testing.expectError(test_error, result);
        
        const desc = get_description(test_error);
        try testing.expect(desc.len > 0);
        
        const test_switch = switch (test_error) {
            Error.STOP => true,
            Error.REVERT => true,
            Error.INVALID => true,
            Error.OutOfGas => true,
            Error.StackUnderflow => true,
            Error.StackOverflow => true,
            Error.InvalidJump => true,
            Error.InvalidOpcode => true,
            Error.StaticStateChange => true,
            Error.OutOfOffset => true,
            Error.GasUintOverflow => true,
            Error.WriteProtection => true,
            Error.ReturnDataOutOfBounds => true,
            Error.InvalidReturnDataAccess => true,
            Error.DeployCodeTooBig => true,
            Error.MaxCodeSizeExceeded => true,
            Error.InvalidCodeEntry => true,
            Error.DepthLimit => true,
            Error.OutOfMemory => true,
            Error.InvalidOffset => true,
            Error.InvalidSize => true,
            Error.MemoryLimitExceeded => true,
            Error.ChildContextActive => true,
            Error.NoChildContextToRevertOrCommit => true,
            Error.EOFNotSupported => true,
            Error.AccountNotFound => true,
            Error.StorageNotFound => true,
            Error.CodeNotFound => true,
            Error.InvalidAddress => true,
            Error.DatabaseCorrupted => true,
            Error.NetworkError => true,
            Error.PermissionDenied => true,
            Error.InvalidSnapshot => true,
            Error.NoBatchInProgress => true,
            Error.SnapshotNotFound => true,
        };
        try testing.expect(test_switch);
    }
}

test "fuzz_error_message_uniqueness_detection" {
    var description_map = std.HashMap(u64, Error, std.hash_map.DefaultContext(u64), 80).init(testing.allocator);
    defer description_map.deinit();
    
    const all_errors = [_]Error{
        Error.STOP, Error.REVERT, Error.INVALID, Error.OutOfGas,
        Error.StackUnderflow, Error.StackOverflow, Error.InvalidJump, Error.InvalidOpcode,
        Error.StaticStateChange, Error.OutOfOffset, Error.GasUintOverflow, Error.WriteProtection,
        Error.ReturnDataOutOfBounds, Error.InvalidReturnDataAccess, Error.DeployCodeTooBig,
        Error.MaxCodeSizeExceeded, Error.InvalidCodeEntry, Error.DepthLimit, Error.OutOfMemory,
        Error.InvalidOffset, Error.InvalidSize, Error.MemoryLimitExceeded, Error.ChildContextActive,
        Error.NoChildContextToRevertOrCommit, Error.EOFNotSupported, Error.AccountNotFound,
        Error.StorageNotFound, Error.CodeNotFound, Error.InvalidAddress, Error.DatabaseCorrupted,
        Error.NetworkError, Error.PermissionDenied, Error.InvalidSnapshot, Error.NoBatchInProgress,
        Error.SnapshotNotFound,
    };
    
    for (all_errors) |err| {
        const desc = get_description(err);
        const hash = std.hash_map.hashString(desc);
        
        const existing = description_map.get(hash);
        if (existing) |existing_error| {
            if (existing_error != err) {
                std.log.warn("Potential duplicate description detected: '{}' for errors {} and {}", .{ desc, existing_error, err });
            }
        } else {
            try description_map.put(hash, err);
        }
    }
    
    try testing.expect(description_map.count() >= all_errors.len - 3);
}

test "fuzz_random_error_selection_properties" {
    var prng = std.Random.DefaultPrng.init(789);
    const random = prng.random();
    
    const all_errors = [_]Error{
        Error.STOP, Error.REVERT, Error.INVALID, Error.OutOfGas,
        Error.StackUnderflow, Error.StackOverflow, Error.InvalidJump, Error.InvalidOpcode,
        Error.StaticStateChange, Error.OutOfOffset, Error.GasUintOverflow, Error.WriteProtection,
        Error.ReturnDataOutOfBounds, Error.InvalidReturnDataAccess, Error.DeployCodeTooBig,
        Error.MaxCodeSizeExceeded, Error.InvalidCodeEntry, Error.DepthLimit, Error.OutOfMemory,
        Error.InvalidOffset, Error.InvalidSize, Error.MemoryLimitExceeded, Error.ChildContextActive,
        Error.NoChildContextToRevertOrCommit, Error.EOFNotSupported, Error.AccountNotFound,
        Error.StorageNotFound, Error.CodeNotFound, Error.InvalidAddress, Error.DatabaseCorrupted,
        Error.NetworkError, Error.PermissionDenied, Error.InvalidSnapshot, Error.NoBatchInProgress,
        Error.SnapshotNotFound,
    };
    
    var error_counts = std.HashMap(Error, u32, std.hash_map.DefaultContext(Error), 80).init(testing.allocator);
    defer error_counts.deinit();
    
    const iterations = 1000;
    for (0..iterations) |_| {
        const error_idx = random.intRangeLessThan(usize, 0, all_errors.len);
        const selected_error = all_errors[error_idx];
        
        const current_count = error_counts.get(selected_error) orelse 0;
        try error_counts.put(selected_error, current_count + 1);
        
        const desc = get_description(selected_error);
        try testing.expect(desc.len > 0);
        
        const valid_error = switch (selected_error) {
            Error.STOP, Error.REVERT, Error.INVALID, Error.OutOfGas,
            Error.StackUnderflow, Error.StackOverflow, Error.InvalidJump, Error.InvalidOpcode,
            Error.StaticStateChange, Error.OutOfOffset, Error.GasUintOverflow, Error.WriteProtection,
            Error.ReturnDataOutOfBounds, Error.InvalidReturnDataAccess, Error.DeployCodeTooBig,
            Error.MaxCodeSizeExceeded, Error.InvalidCodeEntry, Error.DepthLimit, Error.OutOfMemory,
            Error.InvalidOffset, Error.InvalidSize, Error.MemoryLimitExceeded, Error.ChildContextActive,
            Error.NoChildContextToRevertOrCommit, Error.EOFNotSupported, Error.AccountNotFound,
            Error.StorageNotFound, Error.CodeNotFound, Error.InvalidAddress, Error.DatabaseCorrupted,
            Error.NetworkError, Error.PermissionDenied, Error.InvalidSnapshot, Error.NoBatchInProgress,
            Error.SnapshotNotFound => true,
        };
        try testing.expect(valid_error);
    }
    
    try testing.expect(error_counts.count() >= 20);
    
    var iterator = error_counts.iterator();
    while (iterator.next()) |entry| {
        try testing.expect(entry.value_ptr.* > 0);
        try testing.expect(entry.value_ptr.* <= iterations);
    }
}
