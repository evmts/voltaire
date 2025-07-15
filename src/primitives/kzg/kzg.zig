const std = @import("std");
const c = @cImport({
    @cInclude("ckzg.h");
});

/// KZG module for EIP-4844 blob transaction support
///
/// This module provides Zig bindings for the c-kzg-4844 library,
/// which implements the cryptographic operations needed for EIP-4844
/// blob transactions on Ethereum.

/// Error types for KZG operations
pub const KZGError = error{
    /// Failed to load trusted setup
    TrustedSetupLoadFailed,
    /// Invalid blob data
    InvalidBlob,
    /// Invalid commitment
    InvalidCommitment,
    /// Invalid proof
    InvalidProof,
    /// Verification failed
    VerificationFailed,
    /// Library error
    LibraryError,
    /// Out of memory
    OutOfMemory,
};

/// KZG Settings wrapper
pub const KZGSettings = struct {
    inner: c.KZGSettings,

    /// Initialize KZG settings with mainnet trusted setup
    pub fn init() !KZGSettings {
        var settings: c.KZGSettings = undefined;
        
        // Use the Ethereum mainnet trusted setup
        const ret = c.load_trusted_setup_file(&settings, c.MAINNET_TRUSTED_SETUP_PATH);
        if (ret != c.C_KZG_OK) {
            return KZGError.TrustedSetupLoadFailed;
        }

        return KZGSettings{ .inner = settings };
    }

    /// Initialize from custom trusted setup file
    pub fn initFromFile(path: [:0]const u8) !KZGSettings {
        var settings: c.KZGSettings = undefined;
        
        const ret = c.load_trusted_setup_file(&settings, path.ptr);
        if (ret != c.C_KZG_OK) {
            return KZGError.TrustedSetupLoadFailed;
        }

        return KZGSettings{ .inner = settings };
    }

    /// Free the trusted setup
    pub fn deinit(self: *KZGSettings) void {
        c.free_trusted_setup(&self.inner);
    }
};

/// KZG Blob wrapper (4096 field elements)
pub const Blob = struct {
    data: [c.BYTES_PER_BLOB]u8,

    /// Initialize empty blob
    pub fn init() Blob {
        return Blob{
            .data = [_]u8{0} ** c.BYTES_PER_BLOB,
        };
    }

    /// Initialize from bytes
    pub fn fromBytes(bytes: []const u8) !Blob {
        if (bytes.len != c.BYTES_PER_BLOB) {
            return KZGError.InvalidBlob;
        }
        var blob = Blob.init();
        @memcpy(&blob.data, bytes);
        return blob;
    }
};

/// KZG Commitment (48 bytes)
pub const KZGCommitment = struct {
    data: [48]u8,

    /// Initialize empty commitment
    pub fn init() KZGCommitment {
        return KZGCommitment{
            .data = [_]u8{0} ** 48,
        };
    }

    /// Initialize from bytes
    pub fn fromBytes(bytes: []const u8) !KZGCommitment {
        if (bytes.len != 48) {
            return KZGError.InvalidCommitment;
        }
        var commitment = KZGCommitment.init();
        @memcpy(&commitment.data, bytes);
        return commitment;
    }

    /// Convert to hex string
    pub fn toHex(self: *const KZGCommitment) [96]u8 {
        var hex: [96]u8 = undefined;
        _ = std.fmt.bufPrint(&hex, "{}", .{std.fmt.fmtSliceHexLower(&self.data)}) catch unreachable;
        return hex;
    }
};

/// KZG Proof (48 bytes)
pub const KZGProof = struct {
    data: [48]u8,

    /// Initialize empty proof
    pub fn init() KZGProof {
        return KZGProof{
            .data = [_]u8{0} ** 48,
        };
    }

    /// Initialize from bytes
    pub fn fromBytes(bytes: []const u8) !KZGProof {
        if (bytes.len != 48) {
            return KZGError.InvalidProof;
        }
        var proof = KZGProof.init();
        @memcpy(&proof.data, bytes);
        return proof;
    }
};

/// Compute KZG commitment for a blob
pub fn blobToKZGCommitment(settings: *const KZGSettings, blob: *const Blob) !KZGCommitment {
    var commitment: KZGCommitment = undefined;
    const ret = c.blob_to_kzg_commitment(
        @ptrCast(&commitment.data),
        @ptrCast(&blob.data),
        &settings.inner,
    );
    
    if (ret != c.C_KZG_OK) {
        return switch (ret) {
            c.C_KZG_BADARGS => KZGError.InvalidBlob,
            c.C_KZG_MALLOC => KZGError.OutOfMemory,
            else => KZGError.LibraryError,
        };
    }

    return commitment;
}

/// Compute KZG proof for blob and commitment
pub fn computeBlobKZGProof(
    settings: *const KZGSettings,
    blob: *const Blob,
    commitment: *const KZGCommitment,
) !KZGProof {
    var proof: KZGProof = undefined;
    const ret = c.compute_blob_kzg_proof(
        @ptrCast(&proof.data),
        @ptrCast(&blob.data),
        @ptrCast(&commitment.data),
        &settings.inner,
    );

    if (ret != c.C_KZG_OK) {
        return switch (ret) {
            c.C_KZG_BADARGS => KZGError.InvalidBlob,
            c.C_KZG_MALLOC => KZGError.OutOfMemory,
            else => KZGError.LibraryError,
        };
    }

    return proof;
}

/// Verify KZG proof for a blob
pub fn verifyBlobKZGProof(
    settings: *const KZGSettings,
    blob: *const Blob,
    commitment: *const KZGCommitment,
    proof: *const KZGProof,
) !bool {
    var ok: bool = undefined;
    const ret = c.verify_blob_kzg_proof(
        &ok,
        @ptrCast(&blob.data),
        @ptrCast(&commitment.data),
        @ptrCast(&proof.data),
        &settings.inner,
    );

    if (ret != c.C_KZG_OK) {
        return switch (ret) {
            c.C_KZG_BADARGS => KZGError.InvalidBlob,
            c.C_KZG_MALLOC => KZGError.OutOfMemory,
            else => KZGError.LibraryError,
        };
    }

    return ok;
}

/// Verify KZG proof for batch of blobs
pub fn verifyBlobKZGProofBatch(
    settings: *const KZGSettings,
    blobs: []const Blob,
    commitments: []const KZGCommitment,
    proofs: []const KZGProof,
) !bool {
    if (blobs.len != commitments.len or blobs.len != proofs.len) {
        return KZGError.InvalidBlob;
    }

    var ok: bool = undefined;
    const ret = c.verify_blob_kzg_proof_batch(
        &ok,
        @ptrCast(blobs.ptr),
        @ptrCast(commitments.ptr),
        @ptrCast(proofs.ptr),
        blobs.len,
        &settings.inner,
    );

    if (ret != c.C_KZG_OK) {
        return switch (ret) {
            c.C_KZG_BADARGS => KZGError.InvalidBlob,
            c.C_KZG_MALLOC => KZGError.OutOfMemory,
            else => KZGError.LibraryError,
        };
    }

    return ok;
}

/// Compute cells and proofs for a blob (for EIP-7594 PeerDAS)
pub fn computeCellsAndKZGProofs(
    settings: *const KZGSettings,
    blob: *const Blob,
) !struct {
    cells: [c.CELLS_PER_EXT_BLOB][c.BYTES_PER_CELL]u8,
    proofs: [c.CELLS_PER_EXT_BLOB][48]u8,
} {
    var result: struct {
        cells: [c.CELLS_PER_EXT_BLOB][c.BYTES_PER_CELL]u8,
        proofs: [c.CELLS_PER_EXT_BLOB][48]u8,
    } = undefined;

    const ret = c.compute_cells_and_kzg_proofs(
        @ptrCast(&result.cells),
        @ptrCast(&result.proofs),
        @ptrCast(&blob.data),
        &settings.inner,
    );

    if (ret != c.C_KZG_OK) {
        return switch (ret) {
            c.C_KZG_BADARGS => KZGError.InvalidBlob,
            c.C_KZG_MALLOC => KZGError.OutOfMemory,
            else => KZGError.LibraryError,
        };
    }

    return result;
}

/// Field element type (32 bytes in BLS scalar field)
pub const FieldElement = struct {
    data: [32]u8,

    /// Initialize from bytes
    pub fn fromBytes(bytes: []const u8) !FieldElement {
        if (bytes.len != 32) {
            return error.InvalidLength;
        }
        var element = FieldElement{ .data = undefined };
        @memcpy(&element.data, bytes);
        return element;
    }

    /// Check if the field element is valid (less than BLS modulus)
    pub fn isValid(self: *const FieldElement) bool {
        // BLS modulus: 0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001
        const bls_modulus = [32]u8{
            0x73, 0xed, 0xa7, 0x53, 0x29, 0x9d, 0x7d, 0x48,
            0x33, 0x39, 0xd8, 0x08, 0x09, 0xa1, 0xd8, 0x05,
            0x53, 0xbd, 0xa4, 0x02, 0xff, 0xfe, 0x5b, 0xfe,
            0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x01,
        };

        // Compare as big-endian integers
        for (self.data, bls_modulus) |a, b| {
            if (a < b) return true;
            if (a > b) return false;
        }
        return false; // Equal to modulus is invalid
    }
};

/// Verify KZG proof for point evaluation (EIP-4844 precompile)
pub fn verifyKZGProof(
    settings: *const KZGSettings,
    commitment: *const KZGCommitment,
    z: *const FieldElement,
    y: *const FieldElement,
    proof: *const KZGProof,
) !bool {
    var ok: bool = undefined;
    const ret = c.verify_kzg_proof(
        &ok,
        @ptrCast(&commitment.data),
        @ptrCast(&z.data),
        @ptrCast(&y.data),
        @ptrCast(&proof.data),
        &settings.inner,
    );

    if (ret != c.C_KZG_OK) {
        return switch (ret) {
            c.C_KZG_BADARGS => KZGError.InvalidProof,
            c.C_KZG_MALLOC => KZGError.OutOfMemory,
            else => KZGError.LibraryError,
        };
    }

    return ok;
}

/// Constants from c-kzg-4844
pub const BYTES_PER_BLOB = c.BYTES_PER_BLOB;
pub const BYTES_PER_COMMITMENT = c.BYTES_PER_COMMITMENT;
pub const BYTES_PER_PROOF = c.BYTES_PER_PROOF;
pub const BYTES_PER_FIELD_ELEMENT = c.BYTES_PER_FIELD_ELEMENT;
pub const FIELD_ELEMENTS_PER_BLOB = c.FIELD_ELEMENTS_PER_BLOB;
pub const BYTES_PER_CELL = c.BYTES_PER_CELL;
pub const CELLS_PER_EXT_BLOB = c.CELLS_PER_EXT_BLOB;

test "KZG basic operations" {
    // Skip test if we can't initialize KZG (e.g., in tests without trusted setup file)
    var settings = KZGSettings.init() catch |err| switch (err) {
        KZGError.TrustedSetupLoadFailed => {
            std.debug.print("Skipping KZG test: trusted setup not available\n", .{});
            return;
        },
        else => return err,
    };
    defer settings.deinit();

    // Create a test blob
    var blob = Blob.init();
    blob.data[0] = 1;
    blob.data[1] = 2;
    blob.data[2] = 3;

    // Compute commitment
    const commitment = try blobToKZGCommitment(&settings, &blob);
    try std.testing.expect(commitment.data.len == 48);

    // Compute proof
    const proof = try computeBlobKZGProof(&settings, &blob, &commitment);
    try std.testing.expect(proof.data.len == 48);

    // Verify proof
    const valid = try verifyBlobKZGProof(&settings, &blob, &commitment, &proof);
    try std.testing.expect(valid);
}

test "KZG field element validation" {
    // Valid field element (less than BLS modulus)
    const valid_element = try FieldElement.fromBytes(&[_]u8{0x01} ++ [_]u8{0} ** 31);
    try std.testing.expect(valid_element.isValid());

    // Invalid field element (greater than BLS modulus)
    const invalid_element = try FieldElement.fromBytes(&[_]u8{0xFF} ** 32);
    try std.testing.expect(!invalid_element.isValid());
}