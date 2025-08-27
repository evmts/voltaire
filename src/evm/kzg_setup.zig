/// KZG trusted setup management for EIP-4844 support
const std = @import("std");
const crypto = @import("crypto");

/// Global initialization state
var initialized = false;

/// Initialize the KZG trusted setup from a file
/// This should be called once during application startup
pub fn init(_allocator: std.mem.Allocator, trusted_setup_path: []const u8) !void {
    if (initialized) return;
    _ = _allocator;
    
    // Load the trusted setup using the Zig binding API
    const precompute: u64 = 0;
    crypto.c_kzg.loadTrustedSetupFile(trusted_setup_path, precompute) catch {
        return error.TrustedSetupLoadFailed;
    };
    
    initialized = true;
}

/// Get the global KZG settings
/// Returns null if not initialized
pub fn getSettings() ?*const crypto.c_kzg.KZGSettings {
    if (!initialized) return null;
    return crypto.c_kzg.getSettings() catch null;
}

/// Deinitialize the KZG trusted setup
pub fn deinit(allocator: std.mem.Allocator) void {
    if (!initialized) return;
    
    _ = allocator; // allocator unused
    // Free via Zig binding; ignore error if not loaded
    crypto.c_kzg.freeTrustedSetup() catch {};
    
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
