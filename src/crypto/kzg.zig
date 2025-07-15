const std = @import("std");
const builtin = @import("builtin");

// Conditionally import based on target
const is_wasm = builtin.target.cpu.arch == .wasm32;

// For non-WASM builds, import C library
const c = if (!is_wasm) @cImport({
    @cInclude("ckzg.h");
}) else undefined;

/// KZG module for EIP-4844 blob transaction support
///
/// This module provides Zig bindings for the c-kzg-4844 library,
/// which implements the cryptographic operations needed for EIP-4844
/// blob transactions on Ethereum.
///
/// For WASM builds, this provides a placeholder implementation.

/// Error types for KZG operations
pub const KZGError = error{
    /// Not implemented (for WASM)
    NotImplemented,
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

/// Constants
pub const BYTES_PER_BLOB = 131072;
pub const BYTES_PER_COMMITMENT = 48;
pub const BYTES_PER_PROOF = 48;
pub const BYTES_PER_FIELD_ELEMENT = 32;
pub const FIELD_ELEMENTS_PER_BLOB = 4096;
pub const BYTES_PER_CELL = 2048;
pub const CELLS_PER_EXT_BLOB = 128;

// Native implementation for non-WASM builds
pub const KZGSettings = if (!is_wasm) struct {
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
        
        const ret = c.load_trusted_setup_file(&settings, @ptrCast(path.ptr));
        if (ret != c.C_KZG_OK) {
            return KZGError.TrustedSetupLoadFailed;
        }

        return KZGSettings{ .inner = settings };
    }

    /// Free the KZG settings
    pub fn deinit(self: *KZGSettings) void {
        c.free_trusted_setup(&self.inner);
    }
} else struct {
    // WASM placeholder implementation
    dummy: u8,

    pub fn init() !KZGSettings {
        return KZGError.NotImplemented;
    }

    pub fn initFromFile(path: [:0]const u8) !KZGSettings {
        _ = path;
        return KZGError.NotImplemented;
    }

    pub fn deinit(self: *KZGSettings) void {
        _ = self;
    }
};

/// KZG Blob
pub const Blob = if (!is_wasm) struct {
    inner: c.Blob,

    pub fn init() Blob {
        return Blob{
            .inner = std.mem.zeroes(c.Blob),
        };
    }

    pub fn fromBytes(bytes: []const u8) !Blob {
        if (bytes.len != BYTES_PER_BLOB) {
            return KZGError.InvalidBlob;
        }
        var blob = Blob.init();
        @memcpy(@as(*[BYTES_PER_BLOB]u8, @ptrCast(&blob.inner)), bytes);
        return blob;
    }

    pub fn toBytes(self: *const Blob) *const [BYTES_PER_BLOB]u8 {
        return @ptrCast(&self.inner);
    }
} else struct {
    // WASM placeholder implementation
    data: [BYTES_PER_BLOB]u8,

    pub fn init() Blob {
        return Blob{
            .data = [_]u8{0} ** BYTES_PER_BLOB,
        };
    }

    pub fn fromBytes(bytes: []const u8) !Blob {
        if (bytes.len != BYTES_PER_BLOB) {
            return KZGError.InvalidBlob;
        }
        var blob = Blob.init();
        @memcpy(&blob.data, bytes);
        return blob;
    }

    pub fn toBytes(self: *const Blob) *const [BYTES_PER_BLOB]u8 {
        return &self.data;
    }
};

/// KZG Commitment
pub const KZGCommitment = if (!is_wasm) struct {
    inner: c.KZGCommitment,

    pub fn init() KZGCommitment {
        return KZGCommitment{
            .inner = std.mem.zeroes(c.KZGCommitment),
        };
    }

    pub fn fromBytes(bytes: []const u8) !KZGCommitment {
        if (bytes.len != BYTES_PER_COMMITMENT) {
            return KZGError.InvalidCommitment;
        }
        var commitment = KZGCommitment.init();
        @memcpy(@as(*[BYTES_PER_COMMITMENT]u8, @ptrCast(&commitment.inner)), bytes);
        return commitment;
    }

    pub fn toBytes(self: *const KZGCommitment) *const [BYTES_PER_COMMITMENT]u8 {
        return @ptrCast(&self.inner);
    }

    pub fn toHex(self: *const KZGCommitment) [BYTES_PER_COMMITMENT * 2]u8 {
        var hex: [BYTES_PER_COMMITMENT * 2]u8 = undefined;
        _ = std.fmt.bufPrint(&hex, "{}", .{std.fmt.fmtSliceHexLower(self.toBytes())}) catch unreachable;
        return hex;
    }
} else struct {
    // WASM placeholder implementation
    data: [BYTES_PER_COMMITMENT]u8,

    pub fn init() KZGCommitment {
        return KZGCommitment{
            .data = [_]u8{0} ** BYTES_PER_COMMITMENT,
        };
    }

    pub fn fromBytes(bytes: []const u8) !KZGCommitment {
        if (bytes.len != BYTES_PER_COMMITMENT) {
            return KZGError.InvalidCommitment;
        }
        var commitment = KZGCommitment.init();
        @memcpy(&commitment.data, bytes);
        return commitment;
    }

    pub fn toBytes(self: *const KZGCommitment) *const [BYTES_PER_COMMITMENT]u8 {
        return &self.data;
    }

    pub fn toHex(self: *const KZGCommitment) [BYTES_PER_COMMITMENT * 2]u8 {
        var hex: [BYTES_PER_COMMITMENT * 2]u8 = undefined;
        _ = std.fmt.bufPrint(&hex, "{}", .{std.fmt.fmtSliceHexLower(&self.data)}) catch unreachable;
        return hex;
    }
};

/// KZG Proof
pub const KZGProof = if (!is_wasm) struct {
    inner: c.KZGProof,

    pub fn init() KZGProof {
        return KZGProof{
            .inner = std.mem.zeroes(c.KZGProof),
        };
    }

    pub fn fromBytes(bytes: []const u8) !KZGProof {
        if (bytes.len != BYTES_PER_PROOF) {
            return KZGError.InvalidProof;
        }
        var proof = KZGProof.init();
        @memcpy(@as(*[BYTES_PER_PROOF]u8, @ptrCast(&proof.inner)), bytes);
        return proof;
    }

    pub fn toBytes(self: *const KZGProof) *const [BYTES_PER_PROOF]u8 {
        return @ptrCast(&self.inner);
    }
} else struct {
    // WASM placeholder implementation
    data: [BYTES_PER_PROOF]u8,

    pub fn init() KZGProof {
        return KZGProof{
            .data = [_]u8{0} ** BYTES_PER_PROOF,
        };
    }

    pub fn fromBytes(bytes: []const u8) !KZGProof {
        if (bytes.len != BYTES_PER_PROOF) {
            return KZGError.InvalidProof;
        }
        var proof = KZGProof.init();
        @memcpy(&proof.data, bytes);
        return proof;
    }

    pub fn toBytes(self: *const KZGProof) *const [BYTES_PER_PROOF]u8 {
        return &self.data;
    }
};

/// Field element
pub const FieldElement = if (!is_wasm) struct {
    inner: c.BLSFieldElement,

    pub fn fromBytes(bytes: []const u8) !FieldElement {
        if (bytes.len != BYTES_PER_FIELD_ELEMENT) {
            return error.InvalidLength;
        }
        var element = FieldElement{ .inner = undefined };
        @memcpy(@as(*[BYTES_PER_FIELD_ELEMENT]u8, @ptrCast(&element.inner)), bytes);
        return element;
    }

    pub fn isValid(self: *const FieldElement) bool {
        return c.verify_field_element(&self.inner);
    }
} else struct {
    // WASM placeholder implementation
    data: [BYTES_PER_FIELD_ELEMENT]u8,

    pub fn fromBytes(bytes: []const u8) !FieldElement {
        if (bytes.len != BYTES_PER_FIELD_ELEMENT) {
            return error.InvalidLength;
        }
        var element = FieldElement{ .data = undefined };
        @memcpy(&element.data, bytes);
        return element;
    }

    pub fn isValid(self: *const FieldElement) bool {
        _ = self;
        return true;
    }
};

// KZG Functions

/// Compute KZG commitment for a blob
pub fn blobToKZGCommitment(settings: *const KZGSettings, blob: *const Blob) !KZGCommitment {
    if (is_wasm) {
        return KZGError.NotImplemented;
    }
    
    var commitment = KZGCommitment.init();
    const ret = c.blob_to_kzg_commitment(&commitment.inner, &blob.inner, &settings.inner);
    if (ret != c.C_KZG_OK) {
        return KZGError.LibraryError;
    }
    return commitment;
}

/// Compute KZG proof for a blob
pub fn computeBlobKZGProof(
    settings: *const KZGSettings,
    blob: *const Blob,
    commitment: *const KZGCommitment,
) !KZGProof {
    if (is_wasm) {
        return KZGError.NotImplemented;
    }
    
    var proof = KZGProof.init();
    const ret = c.compute_blob_kzg_proof(&proof.inner, &blob.inner, &commitment.inner, &settings.inner);
    if (ret != c.C_KZG_OK) {
        return KZGError.LibraryError;
    }
    return proof;
}

/// Verify a blob KZG proof
pub fn verifyBlobKZGProof(
    settings: *const KZGSettings,
    blob: *const Blob,
    commitment: *const KZGCommitment,
    proof: *const KZGProof,
) !bool {
    if (is_wasm) {
        return KZGError.NotImplemented;
    }
    
    var result: bool = undefined;
    const ret = c.verify_blob_kzg_proof(&result, &blob.inner, &commitment.inner, &proof.inner, &settings.inner);
    if (ret != c.C_KZG_OK) {
        return KZGError.VerificationFailed;
    }
    return result;
}

/// Verify blob KZG proofs in batch
pub fn verifyBlobKZGProofBatch(
    settings: *const KZGSettings,
    blobs: []const Blob,
    commitments: []const KZGCommitment,
    proofs: []const KZGProof,
) !bool {
    if (is_wasm) {
        return KZGError.NotImplemented;
    }
    
    if (blobs.len != commitments.len or blobs.len != proofs.len) {
        return error.LengthMismatch;
    }

    // Convert to C arrays
    const blob_ptrs = try std.heap.c_allocator.alloc(*const c.Blob, blobs.len);
    defer std.heap.c_allocator.free(blob_ptrs);
    const commitment_ptrs = try std.heap.c_allocator.alloc(*const c.KZGCommitment, commitments.len);
    defer std.heap.c_allocator.free(commitment_ptrs);
    const proof_ptrs = try std.heap.c_allocator.alloc(*const c.KZGProof, proofs.len);
    defer std.heap.c_allocator.free(proof_ptrs);

    for (0..blobs.len) |i| {
        blob_ptrs[i] = &blobs[i].inner;
        commitment_ptrs[i] = &commitments[i].inner;
        proof_ptrs[i] = &proofs[i].inner;
    }

    var result: bool = undefined;
    const ret = c.verify_blob_kzg_proof_batch(
        &result,
        @ptrCast(blob_ptrs.ptr),
        @ptrCast(commitment_ptrs.ptr),
        @ptrCast(proof_ptrs.ptr),
        blobs.len,
        &settings.inner,
    );
    
    if (ret != c.C_KZG_OK) {
        return KZGError.VerificationFailed;
    }
    return result;
}

/// Compute cells and KZG proofs
pub fn computeCellsAndKZGProofs(
    settings: *const KZGSettings,
    blob: *const Blob,
) !struct {
    cells: [CELLS_PER_EXT_BLOB][BYTES_PER_CELL]u8,
    proofs: [CELLS_PER_EXT_BLOB][BYTES_PER_PROOF]u8,
} {
    if (is_wasm) {
        return KZGError.NotImplemented;
    }
    
    var result = .{
        .cells = std.mem.zeroes([CELLS_PER_EXT_BLOB][BYTES_PER_CELL]u8),
        .proofs = std.mem.zeroes([CELLS_PER_EXT_BLOB][BYTES_PER_PROOF]u8),
    };

    const ret = c.compute_cells_and_kzg_proofs(
        @ptrCast(&result.cells),
        @ptrCast(&result.proofs),
        &blob.inner,
        &settings.inner,
    );

    if (ret != c.C_KZG_OK) {
        return KZGError.LibraryError;
    }
    return result;
}

/// Verify KZG proof
pub fn verifyKZGProof(
    settings: *const KZGSettings,
    commitment: *const KZGCommitment,
    z: *const FieldElement,
    y: *const FieldElement,
    proof: *const KZGProof,
) !bool {
    if (is_wasm) {
        return KZGError.NotImplemented;
    }
    
    var result: bool = undefined;
    const ret = c.verify_kzg_proof(
        &result,
        &commitment.inner,
        &z.inner,
        &y.inner,
        &proof.inner,
        &settings.inner,
    );
    
    if (ret != c.C_KZG_OK) {
        return KZGError.VerificationFailed;
    }
    return result;
}