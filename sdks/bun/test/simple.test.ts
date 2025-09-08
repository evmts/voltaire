import { test, expect, describe } from "bun:test";
import { dlopen, FFIType, suffix } from "bun:ffi";
import { join } from "path";

describe("Simple FFI Test", () => {
  test("should load the shared library", () => {
    const libPath = join(__dirname, "../../../zig-out/lib", `libguillotine_ffi.${suffix}`);
    console.log("Library path:", libPath);
    
    // Try to load just the init function first
    const lib = dlopen(libPath, {
      guillotine_init: {
        args: [],
        returns: FFIType.void,
      },
      guillotine_cleanup: {
        args: [],
        returns: FFIType.void,
      },
    });
    
    expect(lib).toBeDefined();
    expect(lib.symbols).toBeDefined();
    expect(lib.symbols.guillotine_init).toBeDefined();
    
    // Initialize
    lib.symbols.guillotine_init();
    
    // Cleanup
    lib.symbols.guillotine_cleanup();
    
    console.log("✅ Library loaded and initialized successfully");
  });
});