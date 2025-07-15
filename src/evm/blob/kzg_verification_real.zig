const std = @import("std");
const blob_types = @import("blob_types.zig");
const KZG = @import("primitives").KZG;

/// KZG Verification Implementation for EIP-4844
///
/// This module provides the real KZG polynomial commitment verification
/// used in EIP-4844 blob transactions using the c-kzg-4844 library.

/// Error types for KZG verification operations
pub const KZGVerificationError = error{
    InvalidCommitment,
    InvalidProof,
    InvalidBlob,
    VerificationFailed,
    LibraryNotAvailable,
    TrustedSetupNotLoaded,
    InvalidTrustedSetup,
    InvalidPoint,
    InvalidFieldElement,
    OutOfMemory,
};

/// KZG verifier using c-kzg-4844
pub const KZGVerifier = struct {
    settings: KZG.KZGSettings,
    allocator: std.mem.Allocator,

    /// Initialize the KZG verifier with trusted setup
    pub fn init(allocator: std.mem.Allocator) !KZGVerifier {
        const settings = KZG.KZGSettings.init() catch |err| switch (err) {
            KZG.KZGError.TrustedSetupLoadFailed => return KZGVerificationError.TrustedSetupNotLoaded,
            KZG.KZGError.OutOfMemory => return KZGVerificationError.OutOfMemory,
            else => return KZGVerificationError.InvalidTrustedSetup,
        };

        return KZGVerifier{
            .settings = settings,
            .allocator = allocator,
        };
    }

    /// Clean up resources used by the verifier
    pub fn deinit(self: *KZGVerifier) void {
        self.settings.deinit();
    }

    /// Verify a KZG proof for blob commitment
    pub fn verify_blob_kzg_proof(
        self: *const KZGVerifier,
        blob: *const blob_types.Blob,
        commitment: *const blob_types.KZGCommitment,
        proof: *const blob_types.KZGProof,
    ) KZGVerificationError!bool {
        // Convert blob_types to KZG types
        const kzg_blob = KZG.Blob.fromBytes(&blob.data) catch return KZGVerificationError.InvalidBlob;
        const kzg_commitment = KZG.KZGCommitment.fromBytes(&commitment.data) catch return KZGVerificationError.InvalidCommitment;
        const kzg_proof = KZG.KZGProof.fromBytes(&proof.data) catch return KZGVerificationError.InvalidProof;

        // Verify using c-kzg-4844
        const valid = KZG.verifyBlobKZGProof(&self.settings, &kzg_blob, &kzg_commitment, &kzg_proof) catch |err| switch (err) {
            KZG.KZGError.InvalidBlob => return KZGVerificationError.InvalidBlob,
            KZG.KZGError.InvalidCommitment => return KZGVerificationError.InvalidCommitment,
            KZG.KZGError.InvalidProof => return KZGVerificationError.InvalidProof,
            KZG.KZGError.VerificationFailed => return false,
            KZG.KZGError.OutOfMemory => return KZGVerificationError.OutOfMemory,
            else => return KZGVerificationError.LibraryNotAvailable,
        };

        return valid;
    }

    /// Compute KZG commitment for a blob
    pub fn blob_to_kzg_commitment(
        self: *const KZGVerifier,
        blob: *const blob_types.Blob,
    ) KZGVerificationError!blob_types.KZGCommitment {
        // Convert blob_types to KZG types
        const kzg_blob = KZG.Blob.fromBytes(&blob.data) catch return KZGVerificationError.InvalidBlob;

        // Compute commitment using c-kzg-4844
        const kzg_commitment = KZG.blobToKZGCommitment(&self.settings, &kzg_blob) catch |err| switch (err) {
            KZG.KZGError.InvalidBlob => return KZGVerificationError.InvalidBlob,
            KZG.KZGError.OutOfMemory => return KZGVerificationError.OutOfMemory,
            else => return KZGVerificationError.LibraryNotAvailable,
        };

        // Convert back to blob_types
        var commitment = blob_types.KZGCommitment.init();
        @memcpy(&commitment.data, &kzg_commitment.data);
        return commitment;
    }

    /// Verify KZG proof for point evaluation (EIP-4844 precompile)
    pub fn verify_kzg_proof(
        self: *const KZGVerifier,
        commitment: *const blob_types.KZGCommitment,
        z: *const blob_types.FieldElement,
        y: *const blob_types.FieldElement,
        proof: *const blob_types.KZGProof,
    ) KZGVerificationError!bool {
        // Convert types
        const kzg_commitment = KZG.KZGCommitment.fromBytes(&commitment.data) catch return KZGVerificationError.InvalidCommitment;
        const kzg_z = KZG.FieldElement.fromBytes(&z.data) catch return KZGVerificationError.InvalidFieldElement;
        const kzg_y = KZG.FieldElement.fromBytes(&y.data) catch return KZGVerificationError.InvalidFieldElement;
        const kzg_proof = KZG.KZGProof.fromBytes(&proof.data) catch return KZGVerificationError.InvalidProof;

        // Verify using c-kzg-4844
        const valid = KZG.verifyKZGProof(&self.settings, &kzg_commitment, &kzg_z, &kzg_y, &kzg_proof) catch |err| switch (err) {
            KZG.KZGError.InvalidProof => return KZGVerificationError.InvalidProof,
            KZG.KZGError.VerificationFailed => return false,
            KZG.KZGError.OutOfMemory => return KZGVerificationError.OutOfMemory,
            else => return KZGVerificationError.LibraryNotAvailable,
        };

        return valid;
    }
};

/// Global KZG verifier instance
var global_verifier: ?KZGVerifier = null;

/// Initialize the global KZG verifier
pub fn init_global_verifier(allocator: std.mem.Allocator) bool {
    if (global_verifier == null) {
        global_verifier = KZGVerifier.init(allocator) catch return false;
    }
    return true;
}

/// Clean up the global KZG verifier
pub fn deinit_global_verifier() void {
    if (global_verifier) |*verifier| {
        verifier.deinit();
        global_verifier = null;
    }
}

/// Get the global KZG verifier instance
pub fn get_global_verifier() ?*const KZGVerifier {
    return if (global_verifier) |*verifier| verifier else null;
}