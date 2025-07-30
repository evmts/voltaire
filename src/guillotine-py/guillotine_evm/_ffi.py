"""
FFI interface for Guillotine EVM Python bindings.

This module provides the low-level FFI interface to the native Guillotine library.
For development, it includes stubs when the native library is not available.
"""

import sys
from typing import Any, Optional

try:
    # Try to import the compiled FFI module
    from ._ffi import lib, ffi  # type: ignore
    _FFI_AVAILABLE = True
except ImportError:
    # Fallback for development when FFI is not built
    _FFI_AVAILABLE = False
    
    class MockFFI:
        """Mock FFI for development when native library is not available."""
        
        def new(self, ctype: str) -> Any:
            """Create a new C structure."""
            if "GuillotineAddress" in ctype:
                return MockAddress()
            elif "GuillotineU256" in ctype:
                return MockU256()
            elif "GuillotineExecutionResult" in ctype:
                return MockExecutionResult()
            return None
        
        def cast(self, ctype: str, value: Any) -> Any:
            """Cast to C type."""
            return value
        
        def buffer(self, data: Any) -> bytes:
            """Get buffer from C data."""
            if hasattr(data, 'bytes'):
                return bytes(data.bytes)
            return b''
    
    class MockAddress:
        """Mock address structure."""
        def __init__(self):
            self.bytes = [0] * 20
    
    class MockU256:
        """Mock U256 structure."""
        def __init__(self):
            self.bytes = [0] * 32
    
    class MockExecutionResult:
        """Mock execution result structure."""
        def __init__(self):
            self.success = False
            self.gas_used = 0
            self.output = None
            self.output_len = 0
            self.error_message = None
    
    class MockLib:
        """Mock library for development."""
        
        def guillotine_vm_create(self) -> Optional[Any]:
            """Mock VM creation."""
            return "mock_vm"
        
        def guillotine_vm_destroy(self, vm: Any) -> None:
            """Mock VM destruction."""
            pass
        
        def guillotine_set_balance(self, vm: Any, address: Any, balance: Any) -> bool:
            """Mock set balance."""
            return True
        
        def guillotine_get_balance(self, vm: Any, address: Any, balance: Any) -> bool:
            """Mock get balance."""
            return True
        
        def guillotine_set_code(self, vm: Any, address: Any, code: Any, code_len: int) -> bool:
            """Mock set code."""
            return True
        
        def guillotine_execute(
            self, vm: Any, from_addr: Any, to_addr: Any, value: Any, 
            input_data: Any, input_len: int, gas_limit: int
        ) -> MockExecutionResult:
            """Mock execution."""
            result = MockExecutionResult()
            result.success = True
            result.gas_used = min(gas_limit, 21000)
            return result
        
        def guillotine_free_result(self, result: Any) -> None:
            """Mock result cleanup."""
            pass
        
        def primitives_init(self) -> int:
            """Mock primitives init."""
            return 0
        
        def primitives_deinit(self) -> None:
            """Mock primitives deinit."""
            pass
        
        def evm_init(self) -> int:
            """Mock EVM init."""
            return 0
        
        def evm_deinit(self) -> None:
            """Mock EVM deinit."""
            pass
        
        def evm_is_initialized(self) -> int:
            """Mock EVM initialization check."""
            return 1
    
    # Create mock objects
    ffi = MockFFI()
    lib = MockLib()


def is_ffi_available() -> bool:
    """Check if the native FFI library is available."""
    return _FFI_AVAILABLE


def require_ffi() -> None:
    """Require FFI to be available, raise error if not."""
    if not _FFI_AVAILABLE:
        raise RuntimeError(
            "Native Guillotine library not available. "
            "Please build the project with 'zig build' first."
        )