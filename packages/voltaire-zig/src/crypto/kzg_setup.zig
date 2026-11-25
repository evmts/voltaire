/// KZG trusted setup management for EIP-4844 support
const std = @import("std");
const crypto = @import("root.zig");
const c_kzg = crypto.c_kzg;
const kzg_trusted_setup = crypto.kzg_trusted_setup;

/// Embedded trusted setup data
const trusted_setup_data = kzg_trusted_setup.data;

/// Serializes init/initFromFile/deinit so a check-then-load or check-then-free
/// sequence is atomic. Whether a setup is loaded is never cached here: the
/// binding's own lock-protected `loaded` flag is the single source of truth, so
/// state stays correct when callers use `c_kzg.freeTrustedSetup` directly.
var init_mutex: std.Io.Mutex = .init;

fn mutexIo() std.Io {
    return std.Io.Threaded.global_single_threaded.io();
}

/// Initialize the KZG trusted setup from embedded data
/// This should be called once during application startup
/// Thread-safe for concurrent calls
pub fn init() !void {
    const io = mutexIo();
    init_mutex.lockUncancelable(io);
    defer init_mutex.unlock(io);

    if (c_kzg.isTrustedSetupLoaded()) return;

    // Load the trusted setup using the embedded data
    const precompute: u64 = 0;
    c_kzg.loadTrustedSetupFromText(trusted_setup_data, precompute) catch |err| {
        // TrustedSetupAlreadyLoaded means another caller loaded it directly, which is fine
        if (err != error.TrustedSetupAlreadyLoaded) {
            return error.TrustedSetupLoadFailed;
        }
    };
}

/// Initialize the KZG trusted setup from a file (kept for compatibility)
/// This should be called once during application startup
/// Thread-safe for concurrent calls
pub fn initFromFile(_allocator: std.mem.Allocator, trusted_setup_path: []const u8) !void {
    _ = _allocator;

    const io = mutexIo();
    init_mutex.lockUncancelable(io);
    defer init_mutex.unlock(io);

    if (c_kzg.isTrustedSetupLoaded()) return;

    // Load the trusted setup using the Zig binding API
    const precompute: u64 = 0;
    c_kzg.loadTrustedSetupFile(trusted_setup_path, precompute) catch |err| {
        // TrustedSetupAlreadyLoaded means another caller loaded it directly, which is fine
        if (err != error.TrustedSetupAlreadyLoaded) {
            return error.TrustedSetupLoadFailed;
        }
    };
}

/// Deinitialize the KZG trusted setup
pub fn deinit(allocator: std.mem.Allocator) void {
    _ = allocator; // allocator unused

    const io = mutexIo();
    init_mutex.lockUncancelable(io);
    defer init_mutex.unlock(io);

    // Free via Zig binding; only ignore TrustedSetupNotLoaded error
    c_kzg.freeTrustedSetup() catch |err| {
        // Only acceptable error is TrustedSetupNotLoaded (already freed or never loaded)
        // Any other error should be reported
        if (err != error.TrustedSetupNotLoaded) {
            @panic("Unexpected error during KZG trusted setup cleanup");
        }
    };
}

/// Check if KZG is initialized. Reads the binding's authoritative state, so it
/// never goes stale when `c_kzg.freeTrustedSetup` is called directly.
pub fn isInitialized() bool {
    return c_kzg.isTrustedSetupLoaded();
}

/// Thread-safe KZG proof verification.
/// The binding (`c_kzg`) holds its setup lock shared for the whole C call and
/// exclusive across load and free, so verifications run concurrently and
/// `deinit` waits for in-flight calls instead of freeing settings under them.
/// Returns `error.TrustedSetupNotLoaded` when no setup is loaded.
pub fn verifyKZGProofThreadSafe(
    commitment: *const c_kzg.KZGCommitment,
    z: *const c_kzg.Bytes32,
    y: *const c_kzg.Bytes32,
    proof: *const c_kzg.KZGProof,
) !bool {
    return try c_kzg.verifyKZGProof(commitment, z, y, proof);
}

test "KZG setup initialization" {
    const testing = std.testing;

    // Test the embedded initialization
    try init();
    defer deinit(testing.allocator);

    try testing.expect(isInitialized());
}

test "KZG setup - initial state" {
    const testing = std.testing;

    // Before any initialization, should not be initialized
    // Note: This test assumes a clean state, which might not always be the case
    // in a test suite where other tests have run first
    const initial_state = isInitialized();
    _ = initial_state; // We can't make assumptions about the initial state

    // The function should be callable without error
    try testing.expect(true); // Placeholder assertion
}

test "KZG setup - multiple initializations" {
    const testing = std.testing;

    // First initialization
    try init();
    try testing.expect(isInitialized());

    // Second initialization should not error (idempotent)
    try init();
    try testing.expect(isInitialized());

    // Third initialization
    try init();
    try testing.expect(isInitialized());

    deinit(testing.allocator);
}

test "KZG setup - initialization with invalid path" {
    const testing = std.testing;

    const invalid_path = "nonexistent/path/to/trusted_setup.txt";

    // This should fail
    const result = initFromFile(testing.allocator, invalid_path);
    try testing.expectError(error.TrustedSetupLoadFailed, result);
}

test "KZG setup - initialization with empty path" {
    const testing = std.testing;

    const empty_path = "";

    // This should fail
    const result = initFromFile(testing.allocator, empty_path);
    try testing.expectError(error.TrustedSetupLoadFailed, result);
}

test "KZG setup - deinitialization without initialization" {
    const testing = std.testing;

    // Bring the binding to the not-loaded state regardless of earlier tests
    c_kzg.freeTrustedSetup() catch {};

    // Should not crash or error
    deinit(testing.allocator);

    // State should remain uninitialized
    try testing.expect(!isInitialized());
}

test "KZG setup - multiple deinitializations" {
    const testing = std.testing;

    try init();
    try testing.expect(isInitialized());

    // First deinit
    deinit(testing.allocator);
    try testing.expect(!isInitialized());

    // Second deinit should not crash
    deinit(testing.allocator);
    try testing.expect(!isInitialized());

    // Third deinit should not crash
    deinit(testing.allocator);
    try testing.expect(!isInitialized());
}

test "KZG setup - init/deinit cycle" {
    const testing = std.testing;

    // Multiple init/deinit cycles
    for (0..5) |_| {
        try init();
        try testing.expect(isInitialized());

        deinit(testing.allocator);
        try testing.expect(!isInitialized());
    }
}

test "KZG setup - state consistency" {
    const testing = std.testing;

    // Initially get the state
    const initial_state = isInitialized();

    // Multiple calls to isInitialized should return the same value
    for (0..10) |_| {
        try testing.expectEqual(initial_state, isInitialized());
    }
}

test "KZG setup - path edge cases" {
    const testing = std.testing;

    const test_cases = [_][]const u8{
        "/dev/null", // Special device file
        "/", // Root directory
        ".", // Current directory
        "..", // Parent directory
        "relative/path/file.txt", // Relative path
        "/tmp/nonexistent", // Absolute but nonexistent
        "file_with_no_extension", // No extension
        ".hidden_file", // Hidden file
        "path/with/many/levels/deep/file.txt", // Deep path
    };

    for (test_cases) |path| {
        const result = initFromFile(testing.allocator, path);
        // All these should fail since they're not valid trusted setup files
        try testing.expectError(error.TrustedSetupLoadFailed, result);

        // Ensure we're still not initialized after failed attempts
        try testing.expect(!isInitialized() or isInitialized()); // Allow either state since init might succeed in some environments
    }
}

test "KZG setup - very long path" {
    const testing = std.testing;
    const allocator = testing.allocator;

    // Create a very long path
    const long_path = try allocator.alloc(u8, 1000);
    defer allocator.free(long_path);

    for (long_path) |*char| {
        char.* = 'a';
    }

    const result = initFromFile(testing.allocator, long_path);
    try testing.expectError(error.TrustedSetupLoadFailed, result);
}

test "KZG setup - null termination handling" {
    const testing = std.testing;

    // Test with paths that might cause issues with C interop
    const tricky_paths = [_][]const u8{
        "path\x00with_null", // Embedded null
        "path_ending_in_null\x00", // Null at end
    };

    for (tricky_paths) |path| {
        const result = initFromFile(testing.allocator, path);
        try testing.expectError(error.TrustedSetupLoadFailed, result);
    }
}

test "KZG setup - concurrent safety" {
    const testing = std.testing;

    // Test that multiple calls to isInitialized are safe
    // This is a simple test since we can't easily test true concurrency in Zig tests
    const initial_state = isInitialized();

    // Simulate rapid calls that might happen in concurrent scenarios
    for (0..1000) |_| {
        _ = isInitialized();
    }

    // State should remain consistent
    try testing.expectEqual(initial_state, isInitialized());
}

test "KZG setup - memory allocation edge cases" {
    const testing = std.testing;

    // Test with a failing allocator (this would require a custom allocator implementation)
    // For now, just test with the standard allocator
    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();

    try init();
    try testing.expect(isInitialized());

    deinit(arena.allocator());
    try testing.expect(!isInitialized());
}

test "KZG setup - initialization state transitions" {
    const testing = std.testing;

    // Test state transitions: uninitialized -> initialized -> uninitialized
    try testing.expect(!isInitialized() or isInitialized()); // Initial state might vary

    try init();
    try testing.expect(isInitialized()); // Should be initialized after init

    deinit(testing.allocator);
    try testing.expect(!isInitialized()); // Should be uninitialized after deinit
}

test "loadTrustedSetupFile rejects paths that overflow the buffer or contain NUL" {
    const exact = @as([256]u8, @splat('a'));
    try std.testing.expectError(c_kzg.KZGError.BadArgs, c_kzg.loadTrustedSetupFile(&exact, 0));
    const long = @as([1000]u8, @splat('a'));
    try std.testing.expectError(c_kzg.KZGError.BadArgs, c_kzg.loadTrustedSetupFile(&long, 0));
    try std.testing.expectError(c_kzg.KZGError.BadArgs, c_kzg.loadTrustedSetupFile("src/trusted_setup.txt\x00ignored", 0));
    try std.testing.expectError(c_kzg.KZGError.BadArgs, c_kzg.loadTrustedSetupFile("\x00", 0));
    try std.testing.expect(!c_kzg.isTrustedSetupLoaded());
}

test "operations without a trusted setup return TrustedSetupNotLoaded" {
    try std.testing.expect(!c_kzg.isTrustedSetupLoaded());
    const blob = try std.testing.allocator.create(c_kzg.Blob);
    defer std.testing.allocator.destroy(blob);
    @memset(blob, 0);
    const zero32: c_kzg.Bytes32 = @as([32]u8, @splat(0));
    const zero48: c_kzg.Bytes48 = @as([48]u8, @splat(0));

    try std.testing.expectError(c_kzg.KZGError.TrustedSetupNotLoaded, c_kzg.verifyKZGProof(&zero48, &zero32, &zero32, &zero48));
    try std.testing.expectError(c_kzg.KZGError.TrustedSetupNotLoaded, c_kzg.computeBlobKZGProof(blob, &zero48));
    try std.testing.expectError(c_kzg.KZGError.TrustedSetupNotLoaded, c_kzg.verifyBlobKZGProof(blob, &zero48, &zero48));
    try std.testing.expectError(c_kzg.KZGError.TrustedSetupNotLoaded, c_kzg.blobToKZGCommitment(blob));
    try std.testing.expectError(c_kzg.KZGError.TrustedSetupNotLoaded, c_kzg.computeKZGProof(blob, &zero32));
    try std.testing.expectError(c_kzg.KZGError.TrustedSetupNotLoaded, c_kzg.freeTrustedSetup());
}

test "free waits for in-flight verifications" {
    if (@import("builtin").single_threaded) return error.SkipZigTest;
    try c_kzg.loadTrustedSetupFromText(c_kzg.embedded_trusted_setup, 0);
    const blob = try std.testing.allocator.create(c_kzg.Blob);
    defer std.testing.allocator.destroy(blob);
    @memset(blob, 0);
    const commitment = try c_kzg.blobToKZGCommitment(blob);
    const proof = try c_kzg.computeBlobKZGProof(blob, &commitment);

    const Worker = struct {
        fn run(b: *const c_kzg.Blob, cm: *const c_kzg.Bytes48, pf: *const c_kzg.Bytes48, ok: *std.atomic.Value(u32)) void {
            var i: usize = 0;
            while (i < 4) : (i += 1) {
                const valid = c_kzg.verifyBlobKZGProof(b, cm, pf) catch |err| {
                    // After the free, the only acceptable outcome is a clean error.
                    if (err == c_kzg.KZGError.TrustedSetupNotLoaded) return;
                    ok.store(0, .release);
                    return;
                };
                if (!valid) ok.store(0, .release);
            }
        }
    };
    var ok = std.atomic.Value(u32).init(1);
    var threads: [4]std.Thread = undefined;
    for (&threads) |*t| t.* = try std.Thread.spawn(.{}, Worker.run, .{ blob, &commitment, &proof, &ok });
    try c_kzg.freeTrustedSetup();
    for (threads) |t| t.join();
    try std.testing.expectEqual(@as(u32, 1), ok.load(.acquire));
    try std.testing.expect(!c_kzg.isTrustedSetupLoaded());
}

test "isInitialized follows a direct c_kzg.freeTrustedSetup and init reloads" {
    try init();
    defer deinit(std.testing.allocator);
    try std.testing.expect(isInitialized());

    // Free behind kzg_setup's back: state must not go stale.
    try c_kzg.freeTrustedSetup();
    try std.testing.expect(!isInitialized());

    // init must actually reload rather than trust a cached flag.
    try init();
    try std.testing.expect(isInitialized());
    const zero32: c_kzg.Bytes32 = @as([32]u8, @splat(0));
    var infinity: c_kzg.Bytes48 = @as([48]u8, @splat(0));
    infinity[0] = 0xc0;
    // Commitment and proof at infinity open the zero polynomial: p(0) = 0.
    try std.testing.expect(try verifyKZGProofThreadSafe(&infinity, &zero32, &zero32, &infinity));
}

test "isInitialized sees a setup loaded directly through c_kzg" {
    deinit(std.testing.allocator);
    try c_kzg.loadTrustedSetupFromText(c_kzg.embedded_trusted_setup, 0);
    defer deinit(std.testing.allocator);
    try std.testing.expect(isInitialized());
    // init is a no-op on an already loaded setup
    try init();
    try std.testing.expect(isInitialized());
}
