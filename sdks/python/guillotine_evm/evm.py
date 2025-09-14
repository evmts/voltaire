"""
EVM execution engine for Guillotine EVM Python bindings.

This module provides the main EVM class for executing Ethereum bytecode.
"""

from typing import Optional, Union, List
from dataclasses import dataclass
from enum import Enum

from .primitives import Address, U256, Bytes
from .exceptions import (
    ExecutionError, 
    InvalidBytecodeError, 
    MemoryError,
    GuillotineError
)
from ._ffi_ffi import lib, ffi, is_ffi_available, require_ffi


class EvmError(Enum):
    """EVM error codes."""
    OK = 0
    MEMORY = 1
    INVALID_PARAM = 2
    VM_NOT_INITIALIZED = 3
    EXECUTION_FAILED = 4
    INVALID_ADDRESS = 5
    INVALID_BYTECODE = 6


@dataclass
class ExecutionResult:
    """Result of EVM bytecode execution."""
    success: bool
    gas_used: int
    return_data: bytes
    error_message: Optional[str] = None
    
    def is_success(self) -> bool:
        """Check if execution was successful."""
        return self.success
    
    def is_revert(self) -> bool:
        """Check if execution reverted."""
        return not self.success and self.error_message is not None


class EVM:
    """
    Ethereum Virtual Machine execution engine.
    
    This class provides a high-level interface to the Guillotine EVM for executing
    Ethereum bytecode and managing blockchain state.
    """
    
    def __init__(self) -> None:
        """Initialize a new EVM instance."""
        require_ffi()  # Require real FFI, no mock fallback
        
        self._vm_ptr = None
        self._initialized = False
        
        # Initialize the native EVM
        self._vm_ptr = lib.guillotine_vm_create()
        if self._vm_ptr is None:
            raise MemoryError("Failed to create EVM instance")
        self._initialized = True
    
    def __del__(self) -> None:
        """Cleanup EVM resources."""
        self.close()
    
    def close(self) -> None:
        """Explicitly close and cleanup the EVM."""
        if self._initialized and self._vm_ptr is not None:
            lib.guillotine_vm_destroy(self._vm_ptr)
            self._vm_ptr = None
            self._initialized = False
    
    def is_initialized(self) -> bool:
        """Check if the EVM is properly initialized."""
        return self._initialized and self._vm_ptr is not None
    
    def execute(
        self,
        bytecode: Union[bytes, Bytes],
        caller: Optional[Address] = None,
        to: Optional[Address] = None,
        value: Optional[U256] = None,
        input_data: Optional[Union[bytes, Bytes]] = None,
        gas_limit: int = 1000000
    ) -> ExecutionResult:
        """
        Execute bytecode on the EVM.
        
        Args:
            bytecode: The bytecode to execute
            caller: Address of the caller (defaults to zero address)
            to: Address of the contract being called (defaults to zero address)
            value: Value to transfer (defaults to zero)
            input_data: Input data for the call (defaults to empty)
            gas_limit: Maximum gas to use (defaults to 1,000,000)
        
        Returns:
            ExecutionResult with the results of execution
        
        Raises:
            ExecutionError: If execution fails
            InvalidBytecodeError: If bytecode is invalid
        """
        if not self.is_initialized():
            raise ExecutionError("EVM not initialized")
        
        # Convert inputs
        if isinstance(bytecode, Bytes):
            bytecode_bytes = bytecode.to_bytes()
        else:
            bytecode_bytes = bytecode
        
        if not bytecode_bytes:
            raise InvalidBytecodeError("Bytecode cannot be empty")
        
        if caller is None:
            caller = Address.zero()
        
        if to is None:
            to = Address.zero()
        
        if value is None:
            value = U256.zero()
        
        if input_data is None:
            input_data_bytes = b''
        elif isinstance(input_data, Bytes):
            input_data_bytes = input_data.to_bytes()
        else:
            input_data_bytes = input_data
        
        # FFI is required - no mock fallback
        
        # Prepare C structures
        from_addr = ffi.new("GuillotineAddress *")
        to_addr = ffi.new("GuillotineAddress *")
        value_u256 = ffi.new("GuillotineU256 *")
        
        # Fill address structures
        from_bytes = caller.to_bytes()
        to_bytes = to.to_bytes()
        for i in range(20):
            from_addr.bytes[i] = from_bytes[i]
            to_addr.bytes[i] = to_bytes[i]
        
        # Fill value structure (little-endian)
        value_bytes = value.to_bytes(byteorder='little')
        for i in range(32):
            value_u256.bytes[i] = value_bytes[i]
        
        # First set the bytecode in the EVM state
        if not lib.guillotine_set_code(self._vm_ptr, to_addr, bytecode_bytes, len(bytecode_bytes)):
            raise ExecutionError("Failed to set bytecode in EVM state")
        
        # Execute the bytecode
        result = lib.guillotine_vm_execute(
            self._vm_ptr,
            from_addr,
            to_addr,
            value_u256,
            input_data_bytes if input_data_bytes else ffi.NULL,
            len(input_data_bytes),
            gas_limit
        )
        
        # Convert result
        success = bool(result.success)
        gas_used = int(result.gas_used)
        
        # Get return data
        return_data = b''
        if result.output != ffi.NULL and result.output_len > 0:
            return_data = ffi.buffer(result.output, result.output_len)[:]
        
        # Get error message
        error_message = None
        if result.error_message != ffi.NULL:
            error_message = ffi.string(result.error_message).decode('utf-8')
        
        # Note: guillotine_vm_execute returns by value, no cleanup needed
        
        return ExecutionResult(
            success=success,
            gas_used=gas_used,
            return_data=return_data,
            error_message=error_message
        )
    
    def set_balance(self, address: Address, balance: U256) -> bool:
        """
        Set the balance of an account.
        
        Args:
            address: The account address
            balance: The new balance
        
        Returns:
            True if successful, False otherwise
        """
        if not self.is_initialized():
            return False
        
        # FFI is required - no mock fallback
        
        # Prepare C structures
        addr = ffi.new("GuillotineAddress *")
        bal = ffi.new("GuillotineU256 *")
        
        # Fill structures
        addr_bytes = address.to_bytes()
        for i in range(20):
            addr.bytes[i] = addr_bytes[i]
        
        bal_bytes = balance.to_bytes(byteorder='little')
        for i in range(32):
            bal.bytes[i] = bal_bytes[i]
        
        return bool(lib.guillotine_set_balance(self._vm_ptr, addr, bal))
    
    def get_balance(self, address: Address) -> U256:
        """
        Get the balance of an account.
        
        Args:
            address: The account address
        
        Returns:
            The account balance
        """
        if not self.is_initialized():
            return U256.zero()
        
        # FFI is required - no mock fallback
        
        # Prepare C structures
        addr = ffi.new("GuillotineAddress *")
        bal = ffi.new("GuillotineU256 *")
        
        # Fill address
        addr_bytes = address.to_bytes()
        for i in range(20):
            addr.bytes[i] = addr_bytes[i]
        
        # Get balance - not implemented in C interface yet
        # TODO: Add guillotine_get_balance to C interface
        return U256.zero()
    
    def set_code(self, address: Address, code: Union[bytes, Bytes]) -> bool:
        """
        Set the code of a contract.
        
        Args:
            address: The contract address
            code: The contract bytecode
        
        Returns:
            True if successful, False otherwise
        """
        if not self.is_initialized():
            return False
        
        if isinstance(code, Bytes):
            code_bytes = code.to_bytes()
        else:
            code_bytes = code
        
        # FFI is required - no mock fallback
        
        # Prepare C structure
        addr = ffi.new("GuillotineAddress *")
        
        # Fill address
        addr_bytes = address.to_bytes()
        for i in range(20):
            addr.bytes[i] = addr_bytes[i]
        
        return bool(lib.guillotine_set_code(self._vm_ptr, addr, code_bytes, len(code_bytes)))
    
    def set_storage(self, address: Address, key: U256, value: U256) -> bool:
        """
        Set a storage slot for a contract.
        
        Args:
            address: The contract address
            key: The storage key
            value: The storage value
        
        Returns:
            True if successful, False otherwise
        """
        if not self.is_initialized():
            return False
        
        # FFI is required - no mock fallback
        
        # Prepare C structures
        addr = ffi.new("GuillotineAddress *")
        key_u256 = ffi.new("GuillotineU256 *")
        val_u256 = ffi.new("GuillotineU256 *")
        
        # Fill structures
        addr_bytes = address.to_bytes()
        for i in range(20):
            addr.bytes[i] = addr_bytes[i]
        
        key_bytes = key.to_bytes(byteorder='little')
        for i in range(32):
            key_u256.bytes[i] = key_bytes[i]
        
        val_bytes = value.to_bytes(byteorder='little')
        for i in range(32):
            val_u256.bytes[i] = val_bytes[i]
        
        # Storage operations not implemented in C interface yet
        # TODO: Add guillotine_set_storage to C interface
        return False
    
    def get_storage(self, address: Address, key: U256) -> U256:
        """
        Get a storage slot from a contract.
        
        Args:
            address: The contract address
            key: The storage key
        
        Returns:
            The storage value
        """
        if not self.is_initialized():
            return U256.zero()
        
        # FFI is required - no mock fallback
        
        # Prepare C structures
        addr = ffi.new("GuillotineAddress *")
        key_u256 = ffi.new("GuillotineU256 *")
        val_u256 = ffi.new("GuillotineU256 *")
        
        # Fill structures
        addr_bytes = address.to_bytes()
        for i in range(20):
            addr.bytes[i] = addr_bytes[i]
        
        key_bytes = key.to_bytes(byteorder='little')
        for i in range(32):
            key_u256.bytes[i] = key_bytes[i]
        
        # Get storage - not implemented in C interface yet  
        # TODO: Add guillotine_get_storage to C interface
        return U256.zero()
    
    def __enter__(self) -> 'EVM':
        """Context manager entry."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        """Context manager exit."""
        self.close()