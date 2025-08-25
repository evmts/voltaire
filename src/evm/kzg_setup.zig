/// KZG trusted setup management for EIP-4844 support
const std = @import("std");
const crypto = @import("crypto");

/// Global KZG settings instance (singleton)
var kzg_settings: ?crypto.c_kzg.KZGSettings = null;
var initialized = false;

/// Initialize the KZG trusted setup from a file
/// This should be called once during application startup
pub fn init(allocator: std.mem.Allocator, trusted_setup_path: []const u8) !void {
    if (initialized) return;
    
    // Open the trusted setup file
    const file = try std.fs.cwd().openFile(trusted_setup_path, .{});
    defer file.close();
    
    // Get the file handle for C API
    const c_file = std.c.fopen(trusted_setup_path.ptr, "r");
    if (c_file == null) return error.FileOpenFailed;
    defer _ = std.c.fclose(c_file);
    
    // Allocate KZGSettings
    const settings = try allocator.create(crypto.c_kzg.KZGSettings);
    errdefer allocator.destroy(settings);
    
    // Load the trusted setup
    const precompute = 0; // Default precompute value
    const result = crypto.c_kzg.load_trusted_setup_file(settings, c_file, precompute);
    if (result != crypto.c_kzg.C_KZG_OK) {
        allocator.destroy(settings);
        return error.TrustedSetupLoadFailed;
    }
    
    kzg_settings = settings.*;
    initialized = true;
}

/// Get the global KZG settings
/// Returns null if not initialized
pub fn getSettings() ?*const crypto.c_kzg.KZGSettings {
    if (!initialized) return null;
    return &kzg_settings.?;
}

/// Deinitialize the KZG trusted setup
pub fn deinit(allocator: std.mem.Allocator) void {
    if (!initialized) return;
    
    if (kzg_settings) |*settings| {
        crypto.c_kzg.free_trusted_setup(settings);
        allocator.destroy(settings);
    }
    
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