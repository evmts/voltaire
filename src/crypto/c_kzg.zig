/// C-KZG bindings for EIP-4844 support
const std = @import("std");

// Import the official zig bindings
const ckzg = @import("c_kzg");

// Re-export types from the official bindings
pub const KZGSettings = ckzg.KZGSettings;
pub const Blob = ckzg.Blob;
pub const KZGCommitment = ckzg.KZGCommitment;
pub const KZGProof = ckzg.KZGProof;
pub const Bytes32 = ckzg.Bytes32;
pub const Bytes48 = ckzg.Bytes48;

// Re-export constants
pub const BYTES_PER_BLOB = ckzg.BYTES_PER_BLOB;
pub const BYTES_PER_COMMITMENT = ckzg.BYTES_PER_COMMITMENT;
pub const BYTES_PER_PROOF = ckzg.BYTES_PER_PROOF;
pub const BYTES_PER_FIELD_ELEMENT = ckzg.BYTES_PER_FIELD_ELEMENT;
pub const FIELD_ELEMENTS_PER_BLOB = ckzg.FIELD_ELEMENTS_PER_BLOB;

// Re-export error type
pub const KZGError = ckzg.KZGError;

/// Load trusted setup from file
pub fn loadTrustedSetupFile(trusted_setup_path: []const u8, precompute: u64) KZGError!void {
    const file = std.fs.cwd().openFile(trusted_setup_path, .{}) catch return KZGError.FileNotFound;
    defer file.close();
    
    const file_data = file.readToEndAlloc(std.heap.page_allocator, 1024 * 1024 * 10) catch return KZGError.MallocError;
    defer std.heap.page_allocator.free(file_data);
    
    try ckzg.loadTrustedSetupFromText(file_data, precompute);
}

/// Free the trusted setup
pub fn freeTrustedSetup() KZGError!void {
    try ckzg.freeTrustedSetup();
}


/// Blob to KZG commitment
pub fn blobToKzgCommitment(blob: *const Blob) KZGError!KZGCommitment {
    return try ckzg.blobToKZGCommitment(blob);
}

/// Compute KZG proof
pub fn computeKZGProof(blob: *const Blob, z: *const Bytes32) KZGError!struct { proof: KZGProof, y: Bytes32 } {
    return try ckzg.computeKZGProof(blob, z);
}

/// Re-export the verifyKZGProof function from ckzg
pub const verifyKZGProof = ckzg.verifyKZGProof;

test "c_kzg basic functionality" {
    const testing = std.testing;
    
    // This test requires the trusted setup file to be present
    const trusted_setup_path = "src/kzg/trusted_setup.txt";
    std.fs.cwd().access(trusted_setup_path, .{}) catch {
        // File doesn't exist, skip test
        return;
    };
    
    try loadTrustedSetupFile(trusted_setup_path, 0);
    defer freeTrustedSetup() catch {};
    
    // If we get here without error, the trusted setup loaded successfully
}