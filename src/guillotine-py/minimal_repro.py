#!/usr/bin/env python3
"""
Minimal reproduction test for the C API memory corruption crash.

This test isolates the exact crash to help debug the memory management issue.
"""

import os
import sys
import signal
import traceback
from cffi import FFI

def setup_crash_handler():
    """Set up signal handler to catch crashes."""
    def crash_handler(signum, frame):
        print(f"💥 CRASH: Received signal {signum}")
        print("This confirms the memory corruption issue in C cleanup")
        sys.exit(1)
    
    signal.signal(signal.SIGSEGV, crash_handler)
    signal.signal(signal.SIGBUS, crash_handler)

def test_minimal_crash():
    """Minimal test to reproduce the exact crash."""
    print("🔍 Minimal Crash Reproduction Test")
    print("=" * 50)
    
    # Set up crash detection
    setup_crash_handler()
    
    # Create minimal FFI interface
    ffi = FFI()
    ffi.cdef("""
        int guillotine_init(void);
        void guillotine_deinit(void);
        const char* guillotine_version(void);
        int guillotine_is_initialized(void);
    """)
    
    # Load the library
    lib_path = "/Users/williamcory/guillotine/zig-out/lib/libGuillotine.dylib"
    if not os.path.exists(lib_path):
        print(f"❌ Library not found: {lib_path}")
        return False
    
    try:
        lib = ffi.dlopen(lib_path)
        print(f"✅ Library loaded: {lib_path}")
    except Exception as e:
        print(f"❌ Failed to load library: {e}")
        return False
    
    try:
        # Test 1: Version (should be safe)
        print("\n📋 Step 1: Testing version (safe function)")
        version_ptr = lib.guillotine_version()
        version = ffi.string(version_ptr).decode('utf-8')
        print(f"✅ Version: {version}")
        
        # Test 2: Check if initialized (should be safe)
        print("\n📋 Step 2: Testing is_initialized (safe function)")
        is_init = lib.guillotine_is_initialized()
        print(f"✅ Is initialized: {is_init}")
        
        # Test 3: Initialize (this starts the problem)
        print("\n📋 Step 3: Testing init (problem starts here)")
        print("💡 Calling guillotine_init()...")
        init_result = lib.guillotine_init()
        print(f"✅ Init result: {init_result}")
        
        # Test 4: Check initialized again
        print("\n📋 Step 4: Checking initialization status")
        is_init_after = lib.guillotine_is_initialized()
        print(f"✅ Is initialized after init: {is_init_after}")
        
        # Test 5: Deinitialize (THIS IS WHERE THE CRASH HAPPENS)
        print("\n📋 Step 5: Testing deinit (💥 CRASH EXPECTED HERE)")
        print("⚠️  WARNING: This call will likely crash the process!")
        print("💥 Calling guillotine_deinit()...")
        
        # This is where the crash occurs based on the stack trace
        lib.guillotine_deinit()
        
        print("✅ Deinit completed successfully (unexpected!)")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        traceback.print_exc()
        return False

def test_init_only():
    """Test just the init without deinit to see if init itself is the issue."""
    print("\n🧪 Testing Init-Only (no deinit)")
    print("-" * 30)
    
    ffi = FFI()
    ffi.cdef("""
        int guillotine_init(void);
        int guillotine_is_initialized(void);
    """)
    
    lib_path = "/Users/williamcory/guillotine/zig-out/lib/libGuillotine.dylib"
    
    try:
        lib = ffi.dlopen(lib_path)
        
        print("📋 Calling guillotine_init() without cleanup...")
        init_result = lib.guillotine_init()
        print(f"✅ Init result: {init_result}")
        
        is_init = lib.guillotine_is_initialized()
        print(f"✅ Is initialized: {is_init}")
        
        print("✅ Init-only test completed (no deinit called)")
        print("💡 If this succeeds, the problem is in deinit cleanup")
        return True
        
    except Exception as e:
        print(f"❌ Init-only test failed: {e}")
        return False

def test_multiple_init():
    """Test calling init multiple times to see if that causes issues."""
    print("\n🧪 Testing Multiple Init Calls")
    print("-" * 30)
    
    ffi = FFI()
    ffi.cdef("""
        int guillotine_init(void);
        int guillotine_is_initialized(void);
    """)
    
    lib_path = "/Users/williamcory/guillotine/zig-out/lib/libGuillotine.dylib"
    
    try:
        lib = ffi.dlopen(lib_path)
        
        for i in range(3):
            print(f"📋 Init call #{i+1}")
            init_result = lib.guillotine_init()
            print(f"   Result: {init_result}")
        
        print("✅ Multiple init test completed")
        return True
        
    except Exception as e:
        print(f"❌ Multiple init test failed: {e}")
        return False

if __name__ == "__main__":
    print("🐛 Guillotine C API Crash Reproduction")
    print("=" * 60)
    print("This test will reproduce the memory corruption crash")
    print("that occurs during guillotine_deinit() cleanup.")
    print()
    
    # Test 1: Init without cleanup (should work)
    test_init_only()
    
    # Test 2: Multiple inits (should work due to guard)
    test_multiple_init()
    
    # Test 3: Full cycle with deinit (should crash)
    print("\n" + "="*60)
    print("🚨 FINAL TEST: Full init/deinit cycle (EXPECTED TO CRASH)")
    print("="*60)
    
    input("Press Enter to run the crash test (this will crash Python)...")
    test_minimal_crash()