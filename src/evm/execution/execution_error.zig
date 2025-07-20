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
