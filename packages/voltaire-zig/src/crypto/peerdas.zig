//! EIP-7594 PeerDAS: cells and cell KZG proofs
//!
//! Safe Zig wrapper over the c-kzg-4844 EIP-7594 API.
//!
//! ## Overview
//! PeerDAS extends each 4096-element blob to 8192 elements with a
//! Reed-Solomon code and splits the result into 128 cells of 64 field
//! elements. Each cell carries a KZG proof against the blob commitment. Any 64
//! of the 128 cells are enough to recover the rest.
//!
//! ## Constants
//! - CELLS_PER_EXT_BLOB: 128
//! - CELLS_PER_BLOB: 64
//! - FIELD_ELEMENTS_PER_CELL: 64
//! - BYTES_PER_CELL: 2048
//! - FIELD_ELEMENTS_PER_EXT_BLOB: 8192
//!
//! ## Usage
//! ```zig
//! const peerdas = @import("crypto").peerdas;
//!
//! try crypto.kzg_setup.init();
//!
//! var cells: [peerdas.CELLS_PER_EXT_BLOB]peerdas.Cell = undefined;
//! var proofs: [peerdas.CELLS_PER_EXT_BLOB]peerdas.KZGProof = undefined;
//! try peerdas.computeCellsAndKzgProofs(&blob, &cells, &proofs);
//!
//! const ok = try peerdas.verifyCellKzgProofBatch(commitments, cell_indices, cells[0..n], proofs[0..n]);
//! ```
//!
//! ## Memory
//! No allocator. Outputs go to caller-provided arrays: 128 cells are 256 KiB,
//! so keep them off small stacks.
//!
//! ## Thread safety
//! Every call goes through the `c_kzg` binding, which holds the trusted setup
//! lock shared for the whole C call. Calls run concurrently; freeing the setup
//! (`kzg_setup.deinit`, `c_kzg.freeTrustedSetup`) waits for them to finish, and
//! later calls return `TrustedSetupNotLoaded`.
//!
//! ## References
//! - [EIP-7594](https://eips.ethereum.org/EIPS/eip-7594)
//! - [Fulu polynomial-commitments-sampling](https://github.com/ethereum/consensus-specs/blob/dev/specs/fulu/polynomial-commitments-sampling.md)

const std = @import("std");
const ckzg = @import("c_kzg");

pub const Blob = ckzg.Blob;
pub const Cell = ckzg.Cell;
pub const KZGCommitment = ckzg.KZGCommitment;
pub const KZGProof = ckzg.KZGProof;
pub const Bytes48 = ckzg.Bytes48;
pub const KZGError = ckzg.KZGError;

/// Field elements per cell
pub const FIELD_ELEMENTS_PER_CELL: usize = 64;
/// Bytes per cell (64 field elements of 32 bytes)
pub const BYTES_PER_CELL: usize = 2048;
/// Cells in a blob before extension; the minimum needed for recovery
pub const CELLS_PER_BLOB: usize = 64;
/// Cells in an extended blob
pub const CELLS_PER_EXT_BLOB: usize = 128;
/// Field elements in an extended blob
pub const FIELD_ELEMENTS_PER_EXT_BLOB: usize = 8192;

comptime {
    // The spec values above must match the vendored C library
    std.debug.assert(FIELD_ELEMENTS_PER_CELL == ckzg.FIELD_ELEMENTS_PER_CELL);
    std.debug.assert(BYTES_PER_CELL == ckzg.BYTES_PER_CELL);
    std.debug.assert(CELLS_PER_BLOB == ckzg.CELLS_PER_BLOB);
    std.debug.assert(CELLS_PER_EXT_BLOB == ckzg.CELLS_PER_EXT_BLOB);
    std.debug.assert(FIELD_ELEMENTS_PER_EXT_BLOB == 2 * ckzg.FIELD_ELEMENTS_PER_BLOB);
    std.debug.assert(@sizeOf(Cell) == BYTES_PER_CELL);
}

pub const PeerDasError = KZGError || error{
    /// Parallel input slices have different lengths.
    LengthMismatch,
    /// A cell index is not in [0, CELLS_PER_EXT_BLOB).
    InvalidCellIndex,
    /// Recovery was given fewer than CELLS_PER_BLOB or more than CELLS_PER_EXT_BLOB cells.
    InvalidCellCount,
    /// Recovery cell indices are not strictly ascending (unsorted or duplicated).
    CellIndicesNotAscending,
};

fn validateCellIndices(cell_indices: []const u64) error{InvalidCellIndex}!void {
    for (cell_indices) |cell_index| {
        if (cell_index >= CELLS_PER_EXT_BLOB) return error.InvalidCellIndex;
    }
}

/// Compute all 128 cells of the extended blob, without proofs.
///
/// Much cheaper than `computeCellsAndKzgProofs`. The first `CELLS_PER_BLOB`
/// cells are the blob itself.
///
/// Errors: `TrustedSetupNotLoaded`; `BadArgs` if a blob field element is not
/// canonical (>= BLS modulus).
pub fn computeCells(blob: *const Blob, cells: *[CELLS_PER_EXT_BLOB]Cell) KZGError!void {
    try ckzg.computeCellsAndKZGProofs(cells, null, blob);
}

/// Compute all 128 cells of the extended blob and their KZG proofs.
///
/// `proofs[i]` proves `cells[i]` against the blob's commitment.
///
/// Errors: `TrustedSetupNotLoaded`; `BadArgs` if a blob field element is not
/// canonical (>= BLS modulus).
pub fn computeCellsAndKzgProofs(
    blob: *const Blob,
    cells: *[CELLS_PER_EXT_BLOB]Cell,
    proofs: *[CELLS_PER_EXT_BLOB]KZGProof,
) KZGError!void {
    try ckzg.computeCellsAndKZGProofs(cells, proofs, blob);
}

/// Verify a batch of cell KZG proofs.
///
/// Entry `i` claims that `cells[i]` is cell number `cell_indices[i]` of the
/// blob committed to by `commitments[i]`, proven by `proofs[i]`. Commitments
/// and indices may repeat. An empty batch is valid.
///
/// Returns false when a proof does not verify. Errors: `LengthMismatch`;
/// `InvalidCellIndex`; `TrustedSetupNotLoaded`; `BadArgs` if a commitment or
/// proof is not a valid G1 point or a cell holds a non-canonical field element.
pub fn verifyCellKzgProofBatch(
    commitments: []const Bytes48,
    cell_indices: []const u64,
    cells: []const Cell,
    proofs: []const Bytes48,
) PeerDasError!bool {
    if (commitments.len != cells.len or cell_indices.len != cells.len or proofs.len != cells.len) {
        return error.LengthMismatch;
    }
    try validateCellIndices(cell_indices);
    return ckzg.verifyCellKZGProofBatch(commitments, cell_indices, cells, proofs);
}

/// Recover all 128 cells and proofs from at least 64 cells.
///
/// `cells[i]` is the cell at `cell_indices[i]`. Indices must be strictly
/// ascending. Verify the cells with `verifyCellKzgProofBatch` first: recovery
/// interpolates whatever it is given.
///
/// Errors: `LengthMismatch`; `InvalidCellCount`; `InvalidCellIndex`;
/// `CellIndicesNotAscending`; `TrustedSetupNotLoaded`; `BadArgs` if a cell
/// holds a non-canonical field element.
pub fn recoverCellsAndKzgProofs(
    cell_indices: []const u64,
    cells: []const Cell,
    recovered_cells: *[CELLS_PER_EXT_BLOB]Cell,
    recovered_proofs: *[CELLS_PER_EXT_BLOB]KZGProof,
) PeerDasError!void {
    if (cell_indices.len != cells.len) return error.LengthMismatch;
    if (cells.len < CELLS_PER_BLOB or cells.len > CELLS_PER_EXT_BLOB) return error.InvalidCellCount;
    try validateCellIndices(cell_indices);
    for (cell_indices[1..], cell_indices[0 .. cell_indices.len - 1]) |current, previous| {
        if (current <= previous) return error.CellIndicesNotAscending;
    }
    try ckzg.recoverCellsAndKZGProofs(recovered_cells, recovered_proofs, cell_indices, cells);
}

// ============================================================================
// Tests
// ============================================================================

const testing = std.testing;

/// Blob of canonical field elements: top byte of each element cleared.
fn testBlob(seed: u64) Blob {
    var blob: Blob = undefined;
    var prng = std.Random.DefaultPrng.init(seed);
    prng.random().bytes(&blob);
    var i: usize = 0;
    while (i < blob.len) : (i += ckzg.BYTES_PER_FIELD_ELEMENT) blob[i] = 0;
    return blob;
}

/// Heap-allocated outputs: 128 cells do not belong on a test thread's stack.
const Fixture = struct {
    blob: *Blob,
    cells: *[CELLS_PER_EXT_BLOB]Cell,
    proofs: *[CELLS_PER_EXT_BLOB]KZGProof,

    fn init(seed: u64) !Fixture {
        const blob = try testing.allocator.create(Blob);
        errdefer testing.allocator.destroy(blob);
        blob.* = testBlob(seed);
        const cells = try testing.allocator.create([CELLS_PER_EXT_BLOB]Cell);
        errdefer testing.allocator.destroy(cells);
        const proofs = try testing.allocator.create([CELLS_PER_EXT_BLOB]KZGProof);
        return .{ .blob = blob, .cells = cells, .proofs = proofs };
    }

    fn deinit(self: Fixture) void {
        testing.allocator.destroy(self.blob);
        testing.allocator.destroy(self.cells);
        testing.allocator.destroy(self.proofs);
    }
};

fn loadSetup() !void {
    try ckzg.loadTrustedSetupFromText(ckzg.embedded_trusted_setup, 0);
}

fn freeSetup() void {
    ckzg.freeTrustedSetup() catch unreachable;
}

test "peerdas constants match EIP-7594" {
    try testing.expectEqual(@as(usize, 128), CELLS_PER_EXT_BLOB);
    try testing.expectEqual(@as(usize, 2048), BYTES_PER_CELL);
    try testing.expectEqual(@as(usize, 64), FIELD_ELEMENTS_PER_CELL);
    try testing.expectEqual(@as(usize, 64), CELLS_PER_BLOB);
    try testing.expectEqual(@as(usize, 8192), FIELD_ELEMENTS_PER_EXT_BLOB);
    try testing.expectEqual(BYTES_PER_CELL, FIELD_ELEMENTS_PER_CELL * ckzg.BYTES_PER_FIELD_ELEMENT);
    try testing.expectEqual(CELLS_PER_EXT_BLOB, FIELD_ELEMENTS_PER_EXT_BLOB / FIELD_ELEMENTS_PER_CELL);
    try testing.expectEqual(@as(usize, ckzg.BYTES_PER_BLOB), CELLS_PER_BLOB * BYTES_PER_CELL);
}

test "peerdas operations fail without a trusted setup" {
    try testing.expect(!ckzg.isTrustedSetupLoaded());
    const fx = try Fixture.init(1);
    defer fx.deinit();

    try testing.expectError(error.TrustedSetupNotLoaded, computeCells(fx.blob, fx.cells));
    try testing.expectError(error.TrustedSetupNotLoaded, computeCellsAndKzgProofs(fx.blob, fx.cells, fx.proofs));

    const commitments = [_]Bytes48{@as([48]u8, @splat(0))};
    const indices = [_]u64{0};
    try testing.expectError(error.TrustedSetupNotLoaded, verifyCellKzgProofBatch(&commitments, &indices, fx.cells[0..1], fx.proofs[0..1]));

    var all: [CELLS_PER_BLOB]u64 = undefined;
    for (&all, 0..) |*index, i| index.* = i;
    try testing.expectError(error.TrustedSetupNotLoaded, recoverCellsAndKzgProofs(&all, fx.cells[0..CELLS_PER_BLOB], fx.cells, fx.proofs));
}

test "peerdas computeCells: first half is the blob, deterministic" {
    try loadSetup();
    defer freeSetup();
    const fx = try Fixture.init(7594);
    defer fx.deinit();

    try computeCells(fx.blob, fx.cells);

    // The extension is systematic: cells 0..63 are the blob bytes
    try testing.expectEqualSlices(u8, fx.blob, std.mem.sliceAsBytes(fx.cells[0..CELLS_PER_BLOB]));

    // The extension half is not all zero for a random blob
    var acc: u8 = 0;
    for (std.mem.sliceAsBytes(fx.cells[CELLS_PER_BLOB..])) |byte| acc |= byte;
    try testing.expect(acc != 0);

    const again = try testing.allocator.create([CELLS_PER_EXT_BLOB]Cell);
    defer testing.allocator.destroy(again);
    try computeCells(fx.blob, again);
    try testing.expectEqualSlices(u8, std.mem.sliceAsBytes(fx.cells), std.mem.sliceAsBytes(again));
}

test "peerdas computeCells rejects a non-canonical field element" {
    try loadSetup();
    defer freeSetup();
    const fx = try Fixture.init(3);
    defer fx.deinit();

    // 0xff..ff is far above the BLS12-381 scalar modulus
    @memset(fx.blob[fx.blob.len - 32 ..], 0xff);
    try testing.expectError(error.BadArgs, computeCells(fx.blob, fx.cells));
    try testing.expectError(error.BadArgs, computeCellsAndKzgProofs(fx.blob, fx.cells, fx.proofs));
}

test "peerdas compute, verify and recover round trip" {
    try loadSetup();
    defer freeSetup();
    const fx = try Fixture.init(42);
    defer fx.deinit();

    try computeCellsAndKzgProofs(fx.blob, fx.cells, fx.proofs);
    const commitment = try ckzg.blobToKZGCommitment(fx.blob);

    // computeCells agrees with computeCellsAndKzgProofs
    {
        const cells_only = try testing.allocator.create([CELLS_PER_EXT_BLOB]Cell);
        defer testing.allocator.destroy(cells_only);
        try computeCells(fx.blob, cells_only);
        try testing.expectEqualSlices(u8, std.mem.sliceAsBytes(fx.cells), std.mem.sliceAsBytes(cells_only));
    }

    var commitments: [CELLS_PER_EXT_BLOB]Bytes48 = undefined;
    @memset(&commitments, commitment);
    var indices: [CELLS_PER_EXT_BLOB]u64 = undefined;
    for (&indices, 0..) |*index, i| index.* = i;

    // Every cell verifies, as one batch and as a single-cell batch
    try testing.expect(try verifyCellKzgProofBatch(&commitments, &indices, fx.cells, fx.proofs));
    try testing.expect(try verifyCellKzgProofBatch(commitments[0..1], indices[127..128], fx.cells[127..128], fx.proofs[127..128]));

    // Empty batch is valid
    try testing.expect(try verifyCellKzgProofBatch(&.{}, &.{}, &.{}, &.{}));

    // A flipped bit in one cell fails the batch
    {
        const tampered = try testing.allocator.create([CELLS_PER_EXT_BLOB]Cell);
        defer testing.allocator.destroy(tampered);
        tampered.* = fx.cells.*;
        tampered[70][31] ^= 1;
        try testing.expect(!(try verifyCellKzgProofBatch(&commitments, &indices, tampered, fx.proofs)));
    }

    // A cell presented under the wrong index fails
    {
        const wrong = [_]u64{ 1, 0 };
        try testing.expect(!(try verifyCellKzgProofBatch(commitments[0..2], &wrong, fx.cells[0..2], fx.proofs[0..2])));
    }

    // A proof for another cell fails
    {
        const swapped = [_]KZGProof{ fx.proofs[1], fx.proofs[0] };
        try testing.expect(!(try verifyCellKzgProofBatch(commitments[0..2], indices[0..2], fx.cells[0..2], &swapped)));
    }

    // A commitment to another blob fails
    {
        var other_blob = testBlob(43);
        const other = [_]Bytes48{try ckzg.blobToKZGCommitment(&other_blob)};
        try testing.expect(!(try verifyCellKzgProofBatch(&other, indices[0..1], fx.cells[0..1], fx.proofs[0..1])));
    }

    const recovered_cells = try testing.allocator.create([CELLS_PER_EXT_BLOB]Cell);
    defer testing.allocator.destroy(recovered_cells);
    const recovered_proofs = try testing.allocator.create([CELLS_PER_EXT_BLOB]KZGProof);
    defer testing.allocator.destroy(recovered_proofs);

    // Recover from the extension half only (none of the original data)
    @memset(std.mem.sliceAsBytes(recovered_cells), 0);
    try recoverCellsAndKzgProofs(indices[CELLS_PER_BLOB..], fx.cells[CELLS_PER_BLOB..], recovered_cells, recovered_proofs);
    try testing.expectEqualSlices(u8, std.mem.sliceAsBytes(fx.cells), std.mem.sliceAsBytes(recovered_cells));
    try testing.expectEqualSlices(u8, std.mem.sliceAsBytes(fx.proofs), std.mem.sliceAsBytes(recovered_proofs));
    try testing.expectEqualSlices(u8, fx.blob, std.mem.sliceAsBytes(recovered_cells[0..CELLS_PER_BLOB]));

    // Recover from every other cell
    {
        var even_indices: [CELLS_PER_BLOB]u64 = undefined;
        const even_cells = try testing.allocator.alloc(Cell, CELLS_PER_BLOB);
        defer testing.allocator.free(even_cells);
        for (&even_indices, even_cells, 0..) |*index, *cell, i| {
            index.* = 2 * i;
            cell.* = fx.cells[2 * i];
        }
        @memset(std.mem.sliceAsBytes(recovered_cells), 0);
        try recoverCellsAndKzgProofs(&even_indices, even_cells, recovered_cells, recovered_proofs);
        try testing.expectEqualSlices(u8, std.mem.sliceAsBytes(fx.cells), std.mem.sliceAsBytes(recovered_cells));
        try testing.expectEqualSlices(u8, std.mem.sliceAsBytes(fx.proofs), std.mem.sliceAsBytes(recovered_proofs));
    }
}

test "peerdas verifyCellKzgProofBatch validates inputs" {
    try loadSetup();
    defer freeSetup();
    const fx = try Fixture.init(5);
    defer fx.deinit();
    try computeCells(fx.blob, fx.cells);
    @memset(std.mem.sliceAsBytes(fx.proofs), 0);

    const commitments = [_]Bytes48{ @as([48]u8, @splat(0)), @as([48]u8, @splat(0)) };
    const indices = [_]u64{ 0, 1 };

    try testing.expectError(error.LengthMismatch, verifyCellKzgProofBatch(commitments[0..1], &indices, fx.cells[0..2], fx.proofs[0..2]));
    try testing.expectError(error.LengthMismatch, verifyCellKzgProofBatch(&commitments, indices[0..1], fx.cells[0..2], fx.proofs[0..2]));
    try testing.expectError(error.LengthMismatch, verifyCellKzgProofBatch(&commitments, &indices, fx.cells[0..1], fx.proofs[0..2]));
    try testing.expectError(error.LengthMismatch, verifyCellKzgProofBatch(&commitments, &indices, fx.cells[0..2], fx.proofs[0..1]));
    try testing.expectError(error.LengthMismatch, verifyCellKzgProofBatch(&.{}, &indices, fx.cells[0..2], fx.proofs[0..2]));

    for ([_]u64{ CELLS_PER_EXT_BLOB, CELLS_PER_EXT_BLOB + 1, std.math.maxInt(u64) }) |bad| {
        const bad_indices = [_]u64{ 0, bad };
        try testing.expectError(error.InvalidCellIndex, verifyCellKzgProofBatch(&commitments, &bad_indices, fx.cells[0..2], fx.proofs[0..2]));
    }

    // All-zero bytes are not a compressed G1 point
    try testing.expectError(error.BadArgs, verifyCellKzgProofBatch(&commitments, &indices, fx.cells[0..2], fx.proofs[0..2]));

    // Non-canonical field element in a cell, with well-formed points (the
    // compressed point at infinity)
    const infinity = [_]u8{0xc0} ++ @as([47]u8, @splat(0));
    const points = [_]Bytes48{infinity};
    var bad_cell = [_]Cell{fx.cells[0]};
    @memset(bad_cell[0][0..32], 0xff);
    try testing.expectError(error.BadArgs, verifyCellKzgProofBatch(&points, indices[0..1], &bad_cell, &points));
}

test "peerdas recoverCellsAndKzgProofs validates inputs" {
    try loadSetup();
    defer freeSetup();
    const fx = try Fixture.init(6);
    defer fx.deinit();
    try computeCells(fx.blob, fx.cells);

    const out_cells = try testing.allocator.create([CELLS_PER_EXT_BLOB]Cell);
    defer testing.allocator.destroy(out_cells);

    var indices: [CELLS_PER_EXT_BLOB + 1]u64 = undefined;
    for (&indices, 0..) |*index, i| index.* = i;

    // Length mismatch
    try testing.expectError(error.LengthMismatch, recoverCellsAndKzgProofs(indices[0..65], fx.cells[0..64], out_cells, fx.proofs));

    // Too few and too many cells
    try testing.expectError(error.InvalidCellCount, recoverCellsAndKzgProofs(&.{}, &.{}, out_cells, fx.proofs));
    try testing.expectError(error.InvalidCellCount, recoverCellsAndKzgProofs(indices[0..63], fx.cells[0..63], out_cells, fx.proofs));
    {
        const too_many = try testing.allocator.alloc(Cell, CELLS_PER_EXT_BLOB + 1);
        defer testing.allocator.free(too_many);
        @memset(std.mem.sliceAsBytes(too_many), 0);
        try testing.expectError(error.InvalidCellCount, recoverCellsAndKzgProofs(&indices, too_many, out_cells, fx.proofs));
    }

    // Out-of-range index
    {
        var bad = indices[0..CELLS_PER_BLOB].*;
        bad[63] = CELLS_PER_EXT_BLOB;
        try testing.expectError(error.InvalidCellIndex, recoverCellsAndKzgProofs(&bad, fx.cells[0..64], out_cells, fx.proofs));
    }

    // Duplicate index
    {
        var bad = indices[0..CELLS_PER_BLOB].*;
        bad[10] = 9;
        try testing.expectError(error.CellIndicesNotAscending, recoverCellsAndKzgProofs(&bad, fx.cells[0..64], out_cells, fx.proofs));
    }

    // Unsorted indices
    {
        var bad = indices[0..CELLS_PER_BLOB].*;
        std.mem.swap(u64, &bad[62], &bad[63]);
        try testing.expectError(error.CellIndicesNotAscending, recoverCellsAndKzgProofs(&bad, fx.cells[0..64], out_cells, fx.proofs));
    }

    // Non-canonical field element in a cell
    {
        const bad_cells = try testing.allocator.alloc(Cell, CELLS_PER_BLOB);
        defer testing.allocator.free(bad_cells);
        @memcpy(bad_cells, fx.cells[0..CELLS_PER_BLOB]);
        @memset(bad_cells[5][0..32], 0xff);
        try testing.expectError(error.BadArgs, recoverCellsAndKzgProofs(indices[0..CELLS_PER_BLOB], bad_cells, out_cells, fx.proofs));
    }
}
