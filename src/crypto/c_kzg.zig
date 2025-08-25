// Lightweight fallback c_kzg wrapper to allow builds/tests without the external module.
// Provides types and functions used by precompiles and kzg_setup with graceful failures.
pub const Bytes32 = [32]u8;
pub const Bytes48 = [48]u8;

pub const KZGSettings = struct {};

pub fn loadTrustedSetupFile(path: []const u8, precompute: u64) !void {
    _ = path;
    _ = precompute;
    return error.NotAvailable;
}

pub fn freeTrustedSetup() !void {
    return;
}

pub fn verifyKZGProof(commitment: *const Bytes48, z: *const Bytes32, y: *const Bytes32, proof: *const Bytes48) !bool {
    _ = commitment; _ = z; _ = y; _ = proof;
    return error.NotAvailable;
}

