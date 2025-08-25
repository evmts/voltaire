/// KZG trusted setup management for EIP-4844 support
const std = @import("std");
const crypto = @import("crypto");

/// Global KZG settings instance (singleton)
// var kzg_settings: ?crypto.c_kzg.KZGSettings = null; // c_kzg disabled for Zig 0.15.1
var kzg_settings: ?void = null; // Placeholder until c_kzg is re-enabled
var initialized = false;

/// Initialize the KZG trusted setup from a file
/// This should be called once during application startup
pub fn init(_allocator: std.mem.Allocator, trusted_setup_path: []const u8) !void {
    if (initialized) return;
    _ = _allocator;
    
    // Load the trusted setup using the Zig binding API
    // const precompute: u64 = 0;
    // crypto.c_kzg.loadTrustedSetupFile(trusted_setup_path, precompute) catch {
    //     return error.TrustedSetupLoadFailed;
    // };
    _ = trusted_setup_path;
    // _ = precompute;
    return error.TrustedSetupLoadFailed; // c_kzg disabled for Zig 0.15.1
    // Unreachable code below commented out:
    // // Retrieve settings from binding's internal state
    // // The c-kzg Zig binding keeps settings internally; we mirror them for our API
    // // but we do not need to duplicate memory since we only pass a const pointer out.
    // // Create a local zero-initialized settings; the binding does not expose a getter,
    // // so keep a dummy initialized flag and nil pointer behavior for callers.
    // kzg_settings = .{};
    // initialized = true;
}

/// Get the global KZG settings
/// Returns null if not initialized
pub fn getSettings() ?*const void {
    if (!initialized) return null;
    return null; // c_kzg disabled for Zig 0.15.1
}

/// Deinitialize the KZG trusted setup
pub fn deinit(allocator: std.mem.Allocator) void {
    if (!initialized) return;
    
    _ = allocator; // allocator unused
    // Free via Zig binding; ignore error if not loaded
    // crypto.c_kzg.freeTrustedSetup() catch {}; // c_kzg disabled for Zig 0.15.1
    
    kzg_settings = null;
    initialized = false;
}

/// Check if KZG is initialized
pub fn isInitialized() bool {
    return initialized;
}

test "KZG setup initialization" {
    const testing = std.testing;
    
    // This test requires the trusted setup file to be present
    // Skip if file doesn't exist
    const trusted_setup_path = "data/kzg/trusted_setup.txt";
    std.fs.cwd().access(trusted_setup_path, .{}) catch {
        // File doesn't exist, skip test
        return;
    };
    
    try init(testing.allocator, trusted_setup_path);
    defer deinit(testing.allocator);
    
    try testing.expect(isInitialized());
    const settings = getSettings();
    try testing.expect(settings != null);
}
