#!/usr/bin/env python3
"""
Direct crash test - will crash immediately when calling deinit.
"""

from cffi import FFI

print("🚨 CRASH TEST: This will crash immediately")
print("=" * 50)

# Minimal FFI setup
ffi = FFI()
ffi.cdef("""
    int guillotine_init(void);
    void guillotine_deinit(void);
""")

# Load library
lib = ffi.dlopen("/Users/williamcory/guillotine/zig-out/lib/libGuillotine.dylib")

# Initialize
print("Step 1: Calling init...")
result = lib.guillotine_init()
print(f"Init result: {result}")

# This will crash
print("Step 2: Calling deinit (CRASH EXPECTED)...")
lib.guillotine_deinit()

print("❌ ERROR: If you see this, the crash was fixed!")