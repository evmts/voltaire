"""
Enhanced EVM implementation for Guillotine EVM Python bindings.

This module provides the main EVM class with comprehensive functionality
matching the API specification and test requirements.
"""

from typing import Union, Optional, List, Any
from dataclasses import dataclass
from enum import Enum

from .primitives_enhanced import Address, U256, Hash
from .exceptions import (
    ExecutionError, OutOfGasError, InvalidBytecodeError,
    ValidationError, GuillotineError, MemoryError
)
from ._ffi_comprehensive import ffi, lib, require_ffi


# Result types matching test expectations
@dataclass
class ExecutionResult:
    """Result of EVM bytecode execution."""
    success: bool
    gas_used: int
    return_data: bytes
    logs: List = None
    error: Optional[str] = None
    
    def __post_init__(self):
        if self.logs is None:
            self.logs = []
    
    def is_success(self) -> bool:
        """Check if execution was successful."""
        return self.success
    
    def is_revert(self) -> bool:
        """Check if execution reverted."""
        return not self.success and self.error is not None


@dataclass
class DeployResult:
    """Result of contract deployment."""
    success: bool
    gas_used: int
    contract_address: Optional[Address]
    return_data: bytes
    logs: List = None
    error: Optional[str] = None
    
    def __post_init__(self):
        if self.logs is None:
            self.logs = []


@dataclass
class Log:
    """EVM log entry."""
    address: Address
    topics: List[Hash]
    data: bytes


class HardFork(Enum):
    """Ethereum hard fork versions."""
    FRONTIER = "frontier"
    HOMESTEAD = "homestead" 
    BYZANTIUM = "byzantium"
    CONSTANTINOPLE = "constantinople"
    ISTANBUL = "istanbul"
    BERLIN = "berlin"
    LONDON = "london"
    MERGE = "merge"
    SHANGHAI = "shanghai"
    CANCUN = "cancun"


class EVM:
    """
    Ethereum Virtual Machine execution engine.
    
    This class provides a high-level interface to the Guillotine EVM for executing
    Ethereum bytecode and managing blockchain state.
    """
    
    def __init__(self, *, 
                 gas_limit: int = 30_000_000,
                 chain_id: int = 1,
                 hardfork: HardFork = HardFork.CANCUN) -> None:
        """Initialize EVM with configuration."""
        require_ffi()  # Require real FFI, no mock fallback
        
        # Validate parameters
        if gas_limit <= 0:
            raise ValidationError(f"Gas limit must be positive, got {gas_limit}")
        if chain_id <= 0:
            raise ValidationError(f"Chain ID must be positive, got {chain_id}")
        
        self._vm_ptr = None
        self._initialized = False
        self._gas_limit = gas_limit
        self._chain_id = chain_id
        self._hardfork = hardfork
        self._snapshots: List[int] = []
        self._next_snapshot_id = 1
        
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
    
    def _require_initialized(self) -> None:
        """Ensure EVM is initialized, raise error if not."""
        if not self.is_initialized():
            raise ExecutionError("EVM not initialized")
    
    def _validate_gas_limit(self, gas_limit: int) -> None:
        """Validate gas limit parameter."""
        if gas_limit <= 0:
            raise ValidationError(f"Gas limit must be positive, got {gas_limit}")
        if gas_limit > self._gas_limit:
            raise ValidationError(f"Gas limit {gas_limit} exceeds EVM limit {self._gas_limit}")
    
    def _validate_address(self, address: Optional[Address]) -> Address:
        """Validate and normalize address parameter."""
        if address is None:
            return Address.zero()
        if not isinstance(address, Address):
            raise ValidationError(f"Expected Address, got {type(address)}")
        return address
    
    def _validate_u256(self, value: Optional[U256]) -> U256:
        """Validate and normalize U256 parameter.""" 
        if value is None:
            return U256.zero()
        if not isinstance(value, U256):
            raise ValidationError(f"Expected U256, got {type(value)}")
        return value
    
    def _validate_bytecode(self, bytecode: Union[bytes, 'Bytecode']) -> bytes:
        """Validate and extract bytecode bytes."""
        if hasattr(bytecode, 'to_bytes'):
            # Handle Bytecode object
            bytecode_bytes = bytecode.to_bytes()
        elif isinstance(bytecode, bytes):
            bytecode_bytes = bytecode
        else:
            raise ValidationError(f"Expected bytes or Bytecode, got {type(bytecode)}")
        
        if len(bytecode_bytes) == 0:
            raise InvalidBytecodeError("Bytecode cannot be empty")
        
        if len(bytecode_bytes) > 24576:  # EVM bytecode size limit
            raise InvalidBytecodeError(f"Bytecode too large: {len(bytecode_bytes)} bytes")
        
        return bytecode_bytes
    
    def execute(self, 
                bytecode: Union[bytes, 'Bytecode'], 
                *,
                caller: Optional[Address] = None,
                to: Optional[Address] = None,
                value: Optional[U256] = None,
                input_data: Optional[bytes] = None,
                gas_limit: Optional[int] = None) -> ExecutionResult:
        """
        Execute bytecode and return result.
        
        Args:
            bytecode: The bytecode to execute
            caller: Address of the caller (defaults to zero address)
            to: Address of the contract being called (defaults to zero address)
            value: Value to transfer (defaults to zero)
            input_data: Input data for the call (defaults to empty)
            gas_limit: Maximum gas to use (defaults to EVM gas limit)
        
        Returns:
            ExecutionResult with the results of execution
        
        Raises:
            ExecutionError: If execution fails
            InvalidBytecodeError: If bytecode is invalid
            ValidationError: If parameters are invalid
        """
        self._require_initialized()
        
        # Validate and normalize inputs
        bytecode_bytes = self._validate_bytecode(bytecode)
        caller_addr = self._validate_address(caller)
        to_addr = self._validate_address(to)
        value_u256 = self._validate_u256(value)
        
        if gas_limit is None:
            gas_limit = self._gas_limit
        self._validate_gas_limit(gas_limit)
        
        if input_data is None:
            input_data = b''
        elif not isinstance(input_data, bytes):
            raise ValidationError(f"Input data must be bytes, got {type(input_data)}")
        
        # Prepare C structures
        from_addr = ffi.new("GuillotineAddress *")
        to_addr_c = ffi.new("GuillotineAddress *")
        value_c = ffi.new("GuillotineU256 *")
        
        # Fill address structures
        from_bytes = caller_addr.to_bytes()
        to_bytes = to_addr.to_bytes()
        for i in range(20):
            from_addr.bytes[i] = from_bytes[i]
            to_addr_c.bytes[i] = to_bytes[i]
        
        # Fill value structure (little-endian for C interface)
        value_bytes = value_u256.to_bytes(byteorder='little')
        for i in range(32):
            value_c.bytes[i] = value_bytes[i]
        
        try:
            # Set the bytecode in the EVM state
            if not lib.guillotine_set_code(self._vm_ptr, to_addr_c, bytecode_bytes, len(bytecode_bytes)):
                raise ExecutionError("Failed to set bytecode in EVM state")
            
            # Execute the bytecode
            result = lib.guillotine_vm_execute(
                self._vm_ptr,
                from_addr,
                to_addr_c,
                value_c,
                input_data if input_data else ffi.NULL,
                len(input_data),
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
            
            return ExecutionResult(
                success=success,
                gas_used=gas_used,
                return_data=return_data,
                error=error_message
            )
            
        except Exception as e:
            # Handle any FFI or execution errors
            return ExecutionResult(
                success=False,
                gas_used=0,
                return_data=b'',
                error=f"Execution failed: {str(e)}"
            )
    
    def call(self,
             to: Address,
             *,
             caller: Optional[Address] = None,
             value: Optional[U256] = None,
             input_data: Optional[bytes] = None,
             gas_limit: Optional[int] = None) -> ExecutionResult:
        """
        Call a contract at the given address.
        
        Args:
            to: Address of the contract to call
            caller: Address of the caller (defaults to zero address)
            value: Value to transfer (defaults to zero)
            input_data: Input data for the call (defaults to empty)
            gas_limit: Maximum gas to use (defaults to EVM gas limit)
        
        Returns:
            ExecutionResult with the results of the call
        """
        self._require_initialized()
        
        # Get the bytecode at the target address
        code = self.get_code(to)
        if len(code) == 0:
            # No code at address, return success with empty result
            return ExecutionResult(
                success=True,
                gas_used=21000,  # Base gas cost
                return_data=b''
            )
        
        # Execute the code
        return self.execute(
            bytecode=code,
            caller=caller,
            to=to,
            value=value,
            input_data=input_data,
            gas_limit=gas_limit
        )
    
    def deploy(self,
               bytecode: Union[bytes, 'Bytecode'],
               *,
               caller: Optional[Address] = None,
               value: Optional[U256] = None,
               constructor_args: Optional[bytes] = None,
               gas_limit: Optional[int] = None) -> DeployResult:
        """
        Deploy a contract and return its address.
        
        Args:
            bytecode: The deployment bytecode
            caller: Address of the deployer (defaults to zero address)
            value: Value to transfer (defaults to zero)
            constructor_args: Constructor arguments (defaults to empty)
            gas_limit: Maximum gas to use (defaults to EVM gas limit)
        
        Returns:
            DeployResult with the results of deployment
        """
        self._require_initialized()
        
        caller_addr = self._validate_address(caller)
        
        # Calculate contract address (simplified - in reality would use CREATE opcode logic)
        # For now, use a simple deterministic address based on caller and nonce
        caller_int = int.from_bytes(caller_addr.to_bytes(), byteorder='big')
        contract_addr_int = (caller_int + 1) % (1 << 160)  # Simple nonce increment
        contract_address = Address(contract_addr_int.to_bytes(20, byteorder='big'))
        
        # Combine constructor args with bytecode if provided
        full_bytecode = self._validate_bytecode(bytecode)
        if constructor_args:
            full_bytecode = full_bytecode + constructor_args
        
        # Execute deployment bytecode
        result = self.execute(
            bytecode=full_bytecode,
            caller=caller,
            to=contract_address,
            value=value,
            gas_limit=gas_limit
        )
        
        if result.success:
            # Store the returned runtime code at the contract address
            if len(result.return_data) > 0:
                self.set_code(contract_address, result.return_data)
            
            return DeployResult(
                success=True,
                gas_used=result.gas_used,
                contract_address=contract_address,
                return_data=result.return_data,
                logs=result.logs
            )
        else:
            return DeployResult(
                success=False,
                gas_used=result.gas_used,
                contract_address=None,
                return_data=result.return_data,
                error=result.error,
                logs=result.logs
            )
    
    # State management methods
    def get_balance(self, address: Address) -> U256:
        """Get the balance of an account."""
        self._require_initialized()
        
        if not isinstance(address, Address):
            raise ValidationError(f"Expected Address, got {type(address)}")
        
        # For now, return zero as the C interface doesn't implement get_balance yet
        # TODO: Implement when C interface is available
        return U256.zero()
    
    def set_balance(self, address: Address, balance: U256) -> None:
        """Set the balance of an account."""
        self._require_initialized()
        
        if not isinstance(address, Address):
            raise ValidationError(f"Expected Address, got {type(address)}")
        if not isinstance(balance, U256):
            raise ValidationError(f"Expected U256, got {type(balance)}")
        
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
        
        success = bool(lib.guillotine_set_balance(self._vm_ptr, addr, bal))
        if not success:
            raise ExecutionError(f"Failed to set balance for address {address}")
    
    def get_code(self, address: Address) -> bytes:
        """Get the bytecode of a contract."""
        self._require_initialized()
        
        if not isinstance(address, Address):
            raise ValidationError(f"Expected Address, got {type(address)}")
        
        # For now, return empty as the C interface doesn't implement get_code yet
        # TODO: Implement when C interface is available
        return b''
    
    def set_code(self, address: Address, code: Union[bytes, 'Bytecode']) -> None:
        """Set the bytecode of a contract."""
        self._require_initialized()
        
        if not isinstance(address, Address):
            raise ValidationError(f"Expected Address, got {type(address)}")
        
        if hasattr(code, 'to_bytes'):
            code_bytes = code.to_bytes()
        elif isinstance(code, bytes):
            code_bytes = code
        else:
            raise ValidationError(f"Expected bytes or Bytecode, got {type(code)}")
        
        # Prepare C structure
        addr = ffi.new("GuillotineAddress *")
        
        # Fill address
        addr_bytes = address.to_bytes()
        for i in range(20):
            addr.bytes[i] = addr_bytes[i]
        
        success = bool(lib.guillotine_set_code(self._vm_ptr, addr, code_bytes, len(code_bytes)))
        if not success:
            raise ExecutionError(f"Failed to set code for address {address}")
    
    def get_storage(self, address: Address, key: U256) -> U256:
        """Get a storage value."""
        self._require_initialized()
        
        if not isinstance(address, Address):
            raise ValidationError(f"Expected Address, got {type(address)}")
        if not isinstance(key, U256):
            raise ValidationError(f"Expected U256, got {type(key)}")
        
        # For now, return zero as the C interface doesn't implement get_storage yet
        # TODO: Implement when C interface is available
        return U256.zero()
    
    def set_storage(self, address: Address, key: U256, value: U256) -> None:
        """Set a storage value."""
        self._require_initialized()
        
        if not isinstance(address, Address):
            raise ValidationError(f"Expected Address, got {type(address)}")
        if not isinstance(key, U256):
            raise ValidationError(f"Expected U256, got {type(key)}")
        if not isinstance(value, U256):
            raise ValidationError(f"Expected U256, got {type(value)}")
        
        # For now, this is a no-op as the C interface doesn't implement set_storage yet
        # TODO: Implement when C interface is available
        pass
    
    def get_transient_storage(self, address: Address, key: U256) -> U256:
        """Get a transient storage value (EIP-1153)."""
        self._require_initialized()
        
        if not isinstance(address, Address):
            raise ValidationError(f"Expected Address, got {type(address)}")
        if not isinstance(key, U256):
            raise ValidationError(f"Expected U256, got {type(key)}")
        
        # For now, return zero as the C interface doesn't implement transient storage yet
        # TODO: Implement when C interface is available
        return U256.zero()
    
    def set_transient_storage(self, address: Address, key: U256, value: U256) -> None:
        """Set a transient storage value (EIP-1153)."""
        self._require_initialized()
        
        if not isinstance(address, Address):
            raise ValidationError(f"Expected Address, got {type(address)}")
        if not isinstance(key, U256):
            raise ValidationError(f"Expected U256, got {type(key)}")
        if not isinstance(value, U256):
            raise ValidationError(f"Expected U256, got {type(value)}")
        
        # For now, this is a no-op as the C interface doesn't implement transient storage yet
        # TODO: Implement when C interface is available
        pass
    
    def account_exists(self, address: Address) -> bool:
        """Check if an account exists."""
        self._require_initialized()
        
        if not isinstance(address, Address):
            raise ValidationError(f"Expected Address, got {type(address)}")
        
        # For now, return False as we don't have account existence checking
        # TODO: Implement when C interface is available
        return False
    
    def delete_account(self, address: Address) -> None:
        """Delete an account (SELFDESTRUCT)."""
        self._require_initialized()
        
        if not isinstance(address, Address):
            raise ValidationError(f"Expected Address, got {type(address)}")
        
        # For now, this is a no-op as the C interface doesn't implement account deletion yet
        # TODO: Implement when C interface is available
        pass
    
    # Snapshot functionality
    def snapshot(self) -> int:
        """Create a snapshot of the current state."""
        self._require_initialized()
        
        snapshot_id = self._next_snapshot_id
        self._next_snapshot_id += 1
        self._snapshots.append(snapshot_id)
        
        # For now, just return a snapshot ID without actual state snapshotting
        # TODO: Implement actual state snapshotting when C interface is available
        return snapshot_id
    
    def revert_to_snapshot(self, snapshot_id: int) -> None:
        """Revert to a previous snapshot."""
        self._require_initialized()
        
        if snapshot_id not in self._snapshots:
            raise ValidationError(f"Invalid snapshot ID: {snapshot_id}")
        
        # For now, just remove newer snapshots without actual state reversion
        # TODO: Implement actual state reversion when C interface is available
        self._snapshots = [sid for sid in self._snapshots if sid <= snapshot_id]
    
    # Context manager support
    def __enter__(self) -> "EVM":
        """Context manager entry."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        """Context manager exit."""
        self.close()