// Main C interface that re-exports both primitives and EVM functionality
// This provides a unified interface for WASM builds while allowing
// individual module builds for more granular bundle size tracking

const std = @import("std");

// Import the modules directly
const primitives_c = @import("primitives_c.zig");
const evm_c = @import("evm_c.zig");

// Re-export all primitives functions
pub usingnamespace primitives_c;

// Re-export all EVM functions  
pub usingnamespace evm_c;

// External function declarations to access the exported functions
extern fn primitives_init() c_int;
extern fn primitives_deinit() void;
extern fn evm_init() c_int;
extern fn evm_deinit() void;

// Combined initialization function that overrides the individual ones
export fn guillotine_init() c_int {
    // Initialize primitives first
    const primitives_result = primitives_init();
    if (primitives_result != 0) {
        return primitives_result;
    }

    // Then initialize EVM
    const evm_result = evm_init();
    if (evm_result != 0) {
        primitives_deinit();
        return evm_result;
    }

    return 0;
}

// Combined cleanup function that overrides the individual ones
export fn guillotine_deinit() void {
    evm_deinit();
    primitives_deinit();
}

// Combined version string
export fn guillotine_version() [*:0]const u8 {
    return "1.0.0";
}

// Test to ensure this compiles
test "C interface compilation" {
    std.testing.refAllDecls(@This());
}
