#!/usr/bin/env python3
"""
EVM2 Python Example using ctypes

This example demonstrates how to use the EVM2 C API from Python.

Requirements:
    - Python 3.6+
    - The EVM2 C library (libevm2_c.a or libevm2_c.dylib)

Usage:
    python3 python_example.py
"""

import ctypes
import os
import sys
from pathlib import Path

def find_library():
    """Find the EVM2 C library in the cache directory."""
    cache_dir = Path(__file__).parent.parent.parent.parent / ".zig-cache" / "o"
    
    # Try to find shared library first (easier to use with ctypes)
    for ext in [".dylib", ".so"]:
        for lib_file in cache_dir.glob(f"*/libevm2_c{ext}"):
            return str(lib_file)
    
    # Fall back to static library (requires more complex loading)
    for lib_file in cache_dir.glob("*/libevm2_c.a"):
        print(f"Warning: Found static library {lib_file}, but ctypes prefers shared libraries")
        return str(lib_file)
    
    return None

def load_evm2_library():
    """Load the EVM2 C library and define function signatures."""
    lib_path = find_library()
    if not lib_path:
        print("Error: EVM2 C library not found.")
        print("Please run 'zig build evm2-c' first.")
        return None
    
    print(f"Loading library: {lib_path}")
    
    try:
        # Load the library
        lib = ctypes.CDLL(lib_path)
        
        # Define function signatures
        # Library metadata
        lib.evm2_version.restype = ctypes.c_char_p
        lib.evm2_build_info.restype = ctypes.c_char_p
        lib.evm2_init.restype = ctypes.c_int
        lib.evm2_cleanup.restype = None
        
        # Frame lifecycle
        lib.evm_frame_create.argtypes = [ctypes.POINTER(ctypes.c_uint8), ctypes.c_size_t, ctypes.c_uint64]
        lib.evm_frame_create.restype = ctypes.c_void_p
        lib.evm_frame_destroy.argtypes = [ctypes.c_void_p]
        lib.evm_frame_destroy.restype = None
        lib.evm_frame_reset.argtypes = [ctypes.c_void_p, ctypes.c_uint64]
        lib.evm_frame_reset.restype = ctypes.c_int
        
        # Execution
        lib.evm_frame_execute.argtypes = [ctypes.c_void_p]
        lib.evm_frame_execute.restype = ctypes.c_int
        
        # Stack operations
        lib.evm_frame_push_u64.argtypes = [ctypes.c_void_p, ctypes.c_uint64]
        lib.evm_frame_push_u64.restype = ctypes.c_int
        lib.evm_frame_push_u32.argtypes = [ctypes.c_void_p, ctypes.c_uint32]
        lib.evm_frame_push_u32.restype = ctypes.c_int
        lib.evm_frame_pop_u64.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_uint64)]
        lib.evm_frame_pop_u64.restype = ctypes.c_int
        lib.evm_frame_peek_u64.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_uint64)]
        lib.evm_frame_peek_u64.restype = ctypes.c_int
        lib.evm_frame_stack_size.argtypes = [ctypes.c_void_p]
        lib.evm_frame_stack_size.restype = ctypes.c_uint32
        lib.evm_frame_stack_capacity.argtypes = [ctypes.c_void_p]
        lib.evm_frame_stack_capacity.restype = ctypes.c_uint32
        
        # State inspection
        lib.evm_frame_get_gas_remaining.argtypes = [ctypes.c_void_p]
        lib.evm_frame_get_gas_remaining.restype = ctypes.c_uint64
        lib.evm_frame_get_gas_used.argtypes = [ctypes.c_void_p]
        lib.evm_frame_get_gas_used.restype = ctypes.c_uint64
        lib.evm_frame_get_pc.argtypes = [ctypes.c_void_p]
        lib.evm_frame_get_pc.restype = ctypes.c_uint32
        lib.evm_frame_get_bytecode_len.argtypes = [ctypes.c_void_p]
        lib.evm_frame_get_bytecode_len.restype = ctypes.c_size_t
        lib.evm_frame_get_current_opcode.argtypes = [ctypes.c_void_p]
        lib.evm_frame_get_current_opcode.restype = ctypes.c_uint8
        lib.evm_frame_is_stopped.argtypes = [ctypes.c_void_p]
        lib.evm_frame_is_stopped.restype = ctypes.c_bool
        
        # Error handling
        lib.evm_error_string.argtypes = [ctypes.c_int]
        lib.evm_error_string.restype = ctypes.c_char_p
        lib.evm_error_is_stop.argtypes = [ctypes.c_int]
        lib.evm_error_is_stop.restype = ctypes.c_bool
        
        # Test functions (debug builds only)
        if hasattr(lib, 'evm2_test_simple_execution'):
            lib.evm2_test_simple_execution.restype = ctypes.c_int
            lib.evm2_test_stack_operations.restype = ctypes.c_int
        
        return lib
        
    except OSError as e:
        print(f"Error loading library: {e}")
        return None

# Error codes (should match the C header)
EVM_SUCCESS = 0
EVM_ERROR_STOP = -9

class EVMFrame:
    """Python wrapper for EVM frame operations."""
    
    def __init__(self, lib, bytecode, initial_gas=1000000):
        self.lib = lib
        self._handle = None
        
        # Convert bytecode to ctypes array
        bytecode_array = (ctypes.c_uint8 * len(bytecode))(*bytecode)
        
        # Create frame
        self._handle = lib.evm_frame_create(bytecode_array, len(bytecode), initial_gas)
        if not self._handle:
            raise RuntimeError("Failed to create EVM frame")
    
    def __del__(self):
        if self._handle and self.lib:
            self.lib.evm_frame_destroy(self._handle)
    
    def execute(self):
        """Execute the frame until completion or error."""
        result = self.lib.evm_frame_execute(self._handle)
        return result
    
    def push_u64(self, value):
        """Push a 64-bit value onto the stack."""
        result = self.lib.evm_frame_push_u64(self._handle, value)
        if result != EVM_SUCCESS:
            raise RuntimeError(f"Push failed: {self.error_string(result)}")
    
    def pop_u64(self):
        """Pop a 64-bit value from the stack."""
        value = ctypes.c_uint64()
        result = self.lib.evm_frame_pop_u64(self._handle, ctypes.byref(value))
        if result != EVM_SUCCESS:
            raise RuntimeError(f"Pop failed: {self.error_string(result)}")
        return value.value
    
    def peek_u64(self):
        """Peek at the top of the stack without removing."""
        value = ctypes.c_uint64()
        result = self.lib.evm_frame_peek_u64(self._handle, ctypes.byref(value))
        if result != EVM_SUCCESS:
            raise RuntimeError(f"Peek failed: {self.error_string(result)}")
        return value.value
    
    @property
    def stack_size(self):
        """Current stack depth."""
        return self.lib.evm_frame_stack_size(self._handle)
    
    @property
    def stack_capacity(self):
        """Maximum stack capacity."""
        return self.lib.evm_frame_stack_capacity(self._handle)
    
    @property
    def gas_remaining(self):
        """Remaining gas."""
        return self.lib.evm_frame_get_gas_remaining(self._handle)
    
    @property
    def gas_used(self):
        """Gas used so far."""
        return self.lib.evm_frame_get_gas_used(self._handle)
    
    @property
    def pc(self):
        """Current program counter."""
        return self.lib.evm_frame_get_pc(self._handle)
    
    @property
    def bytecode_len(self):
        """Bytecode length."""
        return self.lib.evm_frame_get_bytecode_len(self._handle)
    
    @property
    def current_opcode(self):
        """Current opcode at PC."""
        return self.lib.evm_frame_get_current_opcode(self._handle)
    
    @property
    def is_stopped(self):
        """Whether execution has stopped."""
        return self.lib.evm_frame_is_stopped(self._handle)
    
    def error_string(self, error_code):
        """Convert error code to string."""
        return self.lib.evm_error_string(error_code).decode('utf-8')

def main():
    """Main example function."""
    print("EVM2 Python Example")
    print("===================\n")
    
    # Load the library
    lib = load_evm2_library()
    if not lib:
        return 1
    
    # Initialize library
    if lib.evm2_init() != 0:
        print("Failed to initialize EVM2 library")
        return 1
    
    try:
        # Display library information
        version = lib.evm2_version().decode('utf-8')
        build_info = lib.evm2_build_info().decode('utf-8')
        print(f"Library version: {version}")
        print(f"Build info: {build_info}\n")
        
        # Example 1: Simple arithmetic - PUSH1 5, PUSH1 10, ADD, STOP
        print("Example 1: Simple Arithmetic (5 + 10)")
        print("Bytecode: PUSH1 5, PUSH1 10, ADD, STOP")
        
        bytecode = [0x60, 0x05, 0x60, 0x0A, 0x01, 0x00]
        frame = EVMFrame(lib, bytecode, 1000000)
        
        print(f"Initial gas: {frame.gas_remaining}")
        print(f"Stack size: {frame.stack_size}")
        print(f"Program counter: {frame.pc}")
        
        # Execute
        result = frame.execute()
        print(f"Execution result: {frame.error_string(result)}")
        
        if result == EVM_SUCCESS or lib.evm_error_is_stop(result):
            print(f"Gas remaining: {frame.gas_remaining}")
            print(f"Gas used: {frame.gas_used}")
            print(f"Final stack size: {frame.stack_size}")
            
            # Pop the result
            if frame.stack_size > 0:
                value = frame.pop_u64()
                print(f"Result value: {value}")
        
        print()
        
        # Example 2: Stack operations
        print("Example 2: Manual Stack Operations")
        
        # Just STOP instruction for testing stack operations
        simple_bytecode = [0x00]
        frame2 = EVMFrame(lib, simple_bytecode, 1000000)
        
        # Push some values manually
        print("Pushing values: 42, 100, 255")
        frame2.push_u64(42)
        frame2.push_u64(100)
        frame2.push_u64(255)
        
        print(f"Stack size: {frame2.stack_size}")
        print(f"Stack capacity: {frame2.stack_capacity}")
        
        # Peek at top value
        peek_value = frame2.peek_u64()
        print(f"Top value (peek): {peek_value}")
        
        # Pop values
        values = []
        while frame2.stack_size > 0:
            values.append(frame2.pop_u64())
        
        print(f"Popped values: {' '.join(map(str, values))}")
        print(f"Final stack size: {frame2.stack_size}")
        print()
        
        # Example 3: Bytecode inspection
        print("Example 3: Bytecode Inspection")
        
        # PUSH1 42, PUSH2 0x1234, POP, STOP
        complex_bytecode = [0x60, 0x2A, 0x61, 0x12, 0x34, 0x50, 0x00]
        frame3 = EVMFrame(lib, complex_bytecode, 1000000)
        
        print(f"Bytecode length: {frame3.bytecode_len} bytes")
        print(f"Bytecode hex: {' '.join(f'{b:02x}' for b in complex_bytecode)}")
        print(f"Current opcode at PC {frame3.pc}: 0x{frame3.current_opcode:02x}")
        print()
        
        # Example 4: Test functions (if available)
        if hasattr(lib, 'evm2_test_simple_execution'):
            print("Example 4: Running Built-in Tests")
            
            result = lib.evm2_test_simple_execution()
            error_str = lib.evm_error_string(result).decode('utf-8')
            print(f"Simple execution test: {error_str}")
            
            result = lib.evm2_test_stack_operations()
            error_str = lib.evm_error_string(result).decode('utf-8')
            print(f"Stack operations test: {error_str}")
            print()
        
        print("All examples completed successfully!")
        
    finally:
        # Cleanup
        lib.evm2_cleanup()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())