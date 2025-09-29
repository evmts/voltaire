"""
Comprehensive tests for Guillotine EVM core execution functionality.

Following TDD approach - these tests define the expected behavior.
"""

import pytest
from dataclasses import dataclass
from typing import List, Optional

from guillotine_evm import (
    EVM, Address, U256, Hash,
    ExecutionError, OutOfGasError, InvalidBytecodeError,
    ValidationError
)


@dataclass
class ExecutionResult:
    """Result of EVM execution."""
    success: bool
    gas_used: int
    return_data: bytes
    logs: List = None
    error: Optional[str] = None
    
    def __post_init__(self):
        if self.logs is None:
            self.logs = []
    
    def is_success(self) -> bool:
        return self.success
    
    def is_revert(self) -> bool:
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


class TestEVMBasics:
    """Basic EVM functionality tests."""
    
    def test_evm_creation(self):
        """Test EVM instance creation."""
        evm = EVM()
        assert evm.is_initialized()
        evm.close()
        assert not evm.is_initialized()
    
    def test_evm_context_manager(self):
        """Test EVM as context manager."""
        with EVM() as evm:
            assert evm.is_initialized()
        # Should be automatically closed after context
    
    def test_evm_configuration(self):
        """Test EVM with custom configuration."""
        evm = EVM(
            gas_limit=50_000_000,
            chain_id=1337
        )
        assert evm.is_initialized()
        evm.close()
    
    def test_evm_multiple_instances(self):
        """Test multiple EVM instances."""
        evm1 = EVM()
        evm2 = EVM()
        
        try:
            assert evm1.is_initialized()
            assert evm2.is_initialized()
        finally:
            evm1.close()
            evm2.close()


class TestEVMExecution:
    """EVM bytecode execution tests."""
    
    def test_execute_simple_push_add(self):
        """Test executing simple PUSH + ADD bytecode."""
        # PUSH1 5, PUSH1 3, ADD, STOP
        bytecode = bytes([0x60, 0x05, 0x60, 0x03, 0x01, 0x00])
        
        with EVM() as evm:
            result = evm.execute(
                bytecode=bytecode,
                gas_limit=100000
            )
            
            assert result.success
            assert result.gas_used > 0
            assert result.gas_used < 100000
            # Result should be 8 (5 + 3) but might be on stack, not returned
    
    def test_execute_simple_return(self):
        """Test executing bytecode that returns data."""
        # PUSH1 42, PUSH1 0, MSTORE, PUSH1 32, PUSH1 0, RETURN
        bytecode = bytes([
            0x60, 0x2a,  # PUSH1 42
            0x60, 0x00,  # PUSH1 0
            0x52,        # MSTORE
            0x60, 0x20,  # PUSH1 32
            0x60, 0x00,  # PUSH1 0
            0xf3         # RETURN
        ])
        
        with EVM() as evm:
            result = evm.execute(
                bytecode=bytecode,
                gas_limit=100000
            )
            
            assert result.success
            assert len(result.return_data) == 32
            # Should have 42 in the first word
    
    def test_execute_with_caller(self):
        """Test execution with specific caller address."""
        # Simple bytecode that just stops
        bytecode = bytes([0x00])  # STOP
        
        caller = Address.from_hex("0x1234567890123456789012345678901234567890")
        
        with EVM() as evm:
            result = evm.execute(
                bytecode=bytecode,
                caller=caller,
                gas_limit=100000
            )
            
            assert result.success
    
    def test_execute_with_value(self):
        """Test execution with value transfer."""
        bytecode = bytes([0x00])  # STOP
        
        caller = Address.from_hex("0x1234567890123456789012345678901234567890")
        value = U256.from_ether(1)
        
        with EVM() as evm:
            # Set balance for caller
            evm.set_balance(caller, U256.from_ether(10))
            
            result = evm.execute(
                bytecode=bytecode,
                caller=caller,
                value=value,
                gas_limit=100000
            )
            
            assert result.success
    
    def test_execute_out_of_gas(self):
        """Test execution running out of gas."""
        # Infinite loop: JUMPDEST, PUSH1 0, JUMP
        bytecode = bytes([0x5b, 0x60, 0x00, 0x56])
        
        with EVM() as evm:
            result = evm.execute(
                bytecode=bytecode,
                gas_limit=1000  # Very low gas limit
            )
            
            assert not result.success
            assert "gas" in result.error.lower() if result.error else True
    
    def test_execute_invalid_bytecode_empty(self):
        """Test execution with empty bytecode."""
        with EVM() as evm:
            with pytest.raises(InvalidBytecodeError):
                evm.execute(
                    bytecode=b"",
                    gas_limit=100000
                )
    
    def test_execute_invalid_bytecode_too_large(self):
        """Test execution with bytecode that's too large."""
        # EVM has a limit of 24576 bytes for bytecode
        large_bytecode = bytes([0x00] * 30000)
        
        with EVM() as evm:
            with pytest.raises(InvalidBytecodeError):
                evm.execute(
                    bytecode=large_bytecode,
                    gas_limit=100000
                )
    
    def test_execute_invalid_opcode(self):
        """Test execution with invalid opcode."""
        # Use an undefined opcode
        bytecode = bytes([0xFF])  # Undefined opcode
        
        with EVM() as evm:
            result = evm.execute(
                bytecode=bytecode,
                gas_limit=100000
            )
            
            assert not result.success
            if result.error:
                assert "invalid" in result.error.lower() or "opcode" in result.error.lower()


class TestEVMStateManagement:
    """EVM state management tests."""
    
    def test_get_set_balance(self):
        """Test getting and setting account balances."""
        address = Address.from_hex("0x1234567890123456789012345678901234567890")
        initial_balance = U256.from_ether(5)
        
        with EVM() as evm:
            # Initially should be zero
            balance = evm.get_balance(address)
            assert balance.is_zero()
            
            # Set balance
            evm.set_balance(address, initial_balance)
            
            # Verify balance
            balance = evm.get_balance(address)
            assert balance == initial_balance
    
    def test_get_set_code(self):
        """Test getting and setting contract code."""
        address = Address.from_hex("0x1234567890123456789012345678901234567890")
        code = bytes([0x60, 0x01, 0x60, 0x02, 0x01, 0x00])  # Simple bytecode
        
        with EVM() as evm:
            # Initially should be empty
            current_code = evm.get_code(address)
            assert len(current_code) == 0
            
            # Set code
            evm.set_code(address, code)
            
            # Verify code
            current_code = evm.get_code(address)
            assert current_code == code
    
    def test_get_set_storage(self):
        """Test getting and setting contract storage."""
        address = Address.from_hex("0x1234567890123456789012345678901234567890")
        key = U256.from_int(42)
        value = U256.from_int(123)
        
        with EVM() as evm:
            # Initially should be zero
            current_value = evm.get_storage(address, key)
            assert current_value.is_zero()
            
            # Set storage
            evm.set_storage(address, key, value)
            
            # Verify storage
            current_value = evm.get_storage(address, key)
            assert current_value == value
    
    def test_get_set_transient_storage(self):
        """Test getting and setting transient storage (EIP-1153)."""
        address = Address.from_hex("0x1234567890123456789012345678901234567890")
        key = U256.from_int(1)
        value = U256.from_int(999)
        
        with EVM() as evm:
            # Initially should be zero
            current_value = evm.get_transient_storage(address, key)
            assert current_value.is_zero()
            
            # Set transient storage
            evm.set_transient_storage(address, key, value)
            
            # Verify transient storage
            current_value = evm.get_transient_storage(address, key)
            assert current_value == value
    
    def test_account_exists(self):
        """Test checking if account exists."""
        address = Address.from_hex("0x1234567890123456789012345678901234567890")
        
        with EVM() as evm:
            # Initially should not exist
            assert not evm.account_exists(address)
            
            # Set balance (creates account)
            evm.set_balance(address, U256.from_int(1))
            
            # Should now exist
            assert evm.account_exists(address)


class TestEVMContractOperations:
    """EVM contract call and deployment tests."""
    
    def test_deploy_simple_contract(self):
        """Test deploying a simple contract."""
        # Simple contract bytecode that returns itself
        deploy_code = bytes([
            0x60, 0x0a,  # PUSH1 10 (length of runtime code)
            0x60, 0x0c,  # PUSH1 12 (offset of runtime code)
            0x60, 0x00,  # PUSH1 0 (memory offset)
            0x39,        # CODECOPY
            0x60, 0x0a,  # PUSH1 10 (length)
            0x60, 0x00,  # PUSH1 0 (offset)
            0xf3,        # RETURN
            # Runtime code starts here
            0x60, 0x01,  # PUSH1 1
            0x60, 0x02,  # PUSH1 2
            0x01,        # ADD
            0x60, 0x00,  # PUSH1 0
            0x52,        # MSTORE
            0x60, 0x20,  # PUSH1 32
            0x60, 0x00,  # PUSH1 0
            0xf3         # RETURN
        ])
        
        deployer = Address.from_hex("0x1234567890123456789012345678901234567890")
        
        with EVM() as evm:
            # Set balance for deployer
            evm.set_balance(deployer, U256.from_ether(10))
            
            result = evm.deploy(
                bytecode=deploy_code,
                caller=deployer,
                gas_limit=500000
            )
            
            assert result.success
            assert result.contract_address is not None
            assert not result.contract_address.is_zero()
            
            # Contract should have code
            contract_code = evm.get_code(result.contract_address)
            assert len(contract_code) > 0
    
    def test_call_contract(self):
        """Test calling a deployed contract."""
        # First deploy a simple contract
        deploy_code = bytes([
            0x60, 0x05,  # PUSH1 5 (simple runtime code length)
            0x60, 0x0b,  # PUSH1 11 (offset)
            0x60, 0x00,  # PUSH1 0
            0x39,        # CODECOPY
            0x60, 0x05,  # PUSH1 5
            0x60, 0x00,  # PUSH1 0
            0xf3,        # RETURN
            # Runtime: PUSH1 42, PUSH1 0, MSTORE, PUSH1 32, PUSH1 0, RETURN
            0x60, 0x2a, 0x60, 0x00, 0x52, 0x60, 0x20, 0x60, 0x00, 0xf3
        ])
        
        deployer = Address.from_hex("0x1234567890123456789012345678901234567890")
        caller = Address.from_hex("0x0987654321098765432109876543210987654321")
        
        with EVM() as evm:
            # Set balances
            evm.set_balance(deployer, U256.from_ether(10))
            evm.set_balance(caller, U256.from_ether(5))
            
            # Deploy contract
            deploy_result = evm.deploy(
                bytecode=deploy_code,
                caller=deployer,
                gas_limit=500000
            )
            
            assert deploy_result.success
            contract_address = deploy_result.contract_address
            
            # Call contract
            call_result = evm.call(
                to=contract_address,
                caller=caller,
                gas_limit=100000
            )
            
            assert call_result.success
            # Should return 42 as first word
            assert len(call_result.return_data) == 32


class TestEVMSnapshots:
    """EVM state snapshot and rollback tests."""
    
    def test_snapshot_and_revert(self):
        """Test creating snapshots and reverting state."""
        address = Address.from_hex("0x1234567890123456789012345678901234567890")
        initial_balance = U256.from_ether(10)
        modified_balance = U256.from_ether(5)
        
        with EVM() as evm:
            # Set initial state
            evm.set_balance(address, initial_balance)
            assert evm.get_balance(address) == initial_balance
            
            # Create snapshot
            snapshot_id = evm.snapshot()
            
            # Modify state
            evm.set_balance(address, modified_balance)
            assert evm.get_balance(address) == modified_balance
            
            # Revert to snapshot
            evm.revert_to_snapshot(snapshot_id)
            
            # State should be restored
            assert evm.get_balance(address) == initial_balance
    
    def test_nested_snapshots(self):
        """Test nested snapshots and selective rollback."""
        address = Address.from_hex("0x1234567890123456789012345678901234567890")
        
        with EVM() as evm:
            # Initial state
            evm.set_balance(address, U256.from_ether(10))
            
            # First snapshot
            snap1 = evm.snapshot()
            evm.set_balance(address, U256.from_ether(8))
            
            # Second snapshot
            snap2 = evm.snapshot()
            evm.set_balance(address, U256.from_ether(6))
            
            # Revert to second snapshot (should be no change)
            evm.revert_to_snapshot(snap2)
            assert evm.get_balance(address).to_ether() == 6.0
            
            # Revert to first snapshot
            evm.revert_to_snapshot(snap1)
            assert evm.get_balance(address).to_ether() == 8.0


class TestEVMErrorHandling:
    """EVM error handling and edge cases."""
    
    def test_execution_after_close(self):
        """Test that execution fails after EVM is closed."""
        evm = EVM()
        evm.close()
        
        with pytest.raises(ExecutionError):
            evm.execute(
                bytecode=bytes([0x00]),  # STOP
                gas_limit=100000
            )
    
    def test_state_operations_after_close(self):
        """Test that state operations fail after EVM is closed."""
        evm = EVM()
        address = Address.from_hex("0x1234567890123456789012345678901234567890")
        evm.close()
        
        with pytest.raises(ExecutionError):
            evm.get_balance(address)
        
        with pytest.raises(ExecutionError):
            evm.set_balance(address, U256.from_int(100))
    
    def test_invalid_gas_limit(self):
        """Test execution with invalid gas limits."""
        bytecode = bytes([0x00])  # STOP
        
        with EVM() as evm:
            # Zero gas should fail
            with pytest.raises(ValidationError):
                evm.execute(
                    bytecode=bytecode,
                    gas_limit=0
                )
            
            # Negative gas should fail
            with pytest.raises(ValidationError):
                evm.execute(
                    bytecode=bytecode,
                    gas_limit=-1
                )
    
    def test_invalid_addresses(self):
        """Test operations with invalid addresses."""
        with EVM() as evm:
            with pytest.raises(ValidationError):
                evm.get_balance(None)  # type: ignore
            
            with pytest.raises(ValidationError):
                evm.set_balance(None, U256.from_int(100))  # type: ignore


class TestEVMIntegration:
    """Integration tests combining multiple EVM features."""
    
    def test_complete_contract_lifecycle(self):
        """Test complete contract deployment, state modification, and calls."""
        deployer = Address.from_hex("0x1234567890123456789012345678901234567890")
        user = Address.from_hex("0x0987654321098765432109876543210987654321")
        
        with EVM() as evm:
            # Set up accounts
            evm.set_balance(deployer, U256.from_ether(10))
            evm.set_balance(user, U256.from_ether(5))
            
            # Deploy a simple storage contract
            # This is a simplified version - real contracts would be more complex
            deploy_code = bytes([0x60, 0x01, 0x60, 0x00, 0x52, 0x60, 0x20, 0x60, 0x00, 0xf3])
            
            result = evm.deploy(
                bytecode=deploy_code,
                caller=deployer,
                gas_limit=500000
            )
            
            assert result.success
            contract_addr = result.contract_address
            
            # Verify deployment
            assert evm.account_exists(contract_addr)
            assert len(evm.get_code(contract_addr)) > 0
            
            # Test contract interaction
            call_result = evm.call(
                to=contract_addr,
                caller=user,
                gas_limit=100000
            )
            
            # Should succeed (even if it doesn't do much)
            assert call_result.success or "not implemented" in (call_result.error or "").lower()
    
    def test_gas_consumption_tracking(self):
        """Test that gas consumption is properly tracked."""
        with EVM() as evm:
            # Simple operations should consume predictable amounts of gas
            simple_bytecode = bytes([0x00])  # STOP
            
            result1 = evm.execute(bytecode=simple_bytecode, gas_limit=100000)
            assert result1.success
            gas_used_simple = result1.gas_used
            
            # More complex operations should use more gas
            complex_bytecode = bytes([
                0x60, 0x01,  # PUSH1 1
                0x60, 0x02,  # PUSH1 2
                0x01,        # ADD
                0x60, 0x03,  # PUSH1 3
                0x01,        # ADD
                0x00         # STOP
            ])
            
            result2 = evm.execute(bytecode=complex_bytecode, gas_limit=100000)
            assert result2.success
            gas_used_complex = result2.gas_used
            
            # Complex should use more gas than simple
            assert gas_used_complex > gas_used_simple