"""
Basic FFI test using only the available C API functions.
"""

from guillotine_evm._ffi_comprehensive import ffi, lib, is_ffi_available

def test_basic_api():
    """Test basic guillotine API functions."""
    print(f"FFI available: {is_ffi_available()}")
    
    if not is_ffi_available():
        print("FFI not available")
        return
    
    print("Testing basic API functions...")
    
    # Test version
    try:
        version = lib.guillotine_version()
        version_str = ffi.string(version).decode('utf-8')
        print(f"Version: {version_str}")
    except Exception as e:
        print(f"Version failed: {e}")
    
    # Test initialization
    try:
        print("Calling guillotine_init...")
        result = lib.guillotine_init()
        print(f"Init result: {result}")
        
        # Check if initialized
        is_init = lib.guillotine_is_initialized()
        print(f"Is initialized: {is_init}")
        
        # Test VM create/destroy
        print("Testing VM creation...")
        vm = lib.guillotine_vm_create()
        if vm != ffi.NULL:
            print("VM created successfully")
            lib.guillotine_vm_destroy(vm)
            print("VM destroyed successfully")
        else:
            print("VM creation returned NULL")
        
        # Cleanup
        lib.guillotine_deinit()
        print("Deinitialized successfully")
        
    except Exception as e:
        print(f"API test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_basic_api()