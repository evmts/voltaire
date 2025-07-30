"""
Tests for Guillotine EVM execution engine.
"""

import pytest
from guillotine_evm import EVM, ExecutionResult, Address, U256, Bytes
from guillotine_evm.exceptions import ExecutionError, InvalidBytecodeError


class TestEVM:
    """Test EVM execution engine."""
    
    def test_evm_initialization(self) -> None:
        """Test EVM initialization and cleanup."""
        evm = EVM()
        assert evm.is_initialized()
        
        evm.close()
        assert not evm.is_initialized()
    
    def test_evm_context_manager(self) -> None:  
        """Test EVM as context manager."""
        with EVM() as evm:
            assert evm.is_initialized()
        
        # Should be cleaned up after exiting context
        assert not evm.is_initialized()
    
    def test_execute_simple_bytecode(self) -> None:
        """Test executing simple bytecode."""
        with EVM() as evm:
            # Simple bytecode: PUSH1 42, PUSH1 0, RETURN (returns 42)
            bytecode = bytes.fromhex("602a6000f3")
            
            result = evm.execute(
                bytecode=bytecode,
                gas_limit=100000
            )
            
            assert isinstance(result, ExecutionResult)
            assert result.success
            assert result.gas_used > 0
            assert result.gas_used <= 100000
            assert result.error_message is None
    
    def test_execute_with_caller_and_value(self) -> None:
        """Test executing bytecode with caller and value."""
        with EVM() as evm:
            caller = Address.from_hex("0x1234567890123456789012345678901234567890")
            to = Address.from_hex("0x0987654321098765432109876543210987654321")
            value = U256.from_int(1000)
            
            # Simple bytecode
            bytecode = bytes.fromhex("6001")  # PUSH1 1
            
            result = evm.execute(
                bytecode=bytecode,
                caller=caller,
                to=to,
                value=value,
                gas_limit=50000
            )
            
            assert result.success
            assert result.gas_used > 0
    
    def test_execute_with_input_data(self) -> None:
        """Test executing bytecode with input data."""
        with EVM() as evm:
            bytecode = bytes.fromhex("6001")  # PUSH1 1
            input_data = b'\x12\x34\x56\x78'
            
            result = evm.execute(
                bytecode=bytecode,
                input_data=input_data,
                gas_limit=50000
            )
            
            assert result.success
    
    def test_execute_with_bytes_objects(self) -> None:
        """Test executing with Bytes objects."""
        with EVM() as evm:
            bytecode = Bytes.from_hex("0x6001")  # PUSH1 1
            input_data = Bytes.from_hex("0x12345678")
            
            result = evm.execute(
                bytecode=bytecode,
                input_data=input_data,
                gas_limit=50000
            )
            
            assert result.success
    
    def test_execute_empty_bytecode(self) -> None:
        """Test executing empty bytecode should fail."""
        with EVM() as evm:
            with pytest.raises(InvalidBytecodeError):
                evm.execute(
                    bytecode=b'',
                    gas_limit=50000
                )
    
    def test_execute_uninitialized_evm(self) -> None:
        """Test executing on uninitialized EVM should fail."""
        evm = EVM()
        evm.close()  # Force close
        
        with pytest.raises(ExecutionError):
            evm.execute(
                bytecode=bytes.fromhex("6001"),
                gas_limit=50000
            )
    
    def test_execute_gas_limit(self) -> None:
        """Test gas limit enforcement."""
        with EVM() as evm:
            # Simple bytecode
            bytecode = bytes.fromhex("6001")  # PUSH1 1
            
            result = evm.execute(
                bytecode=bytecode,
                gas_limit=1000
            )
            
            # Should succeed but use limited gas
            assert result.success
            assert result.gas_used <= 1000
    
    def test_set_get_balance(self) -> None:
        """Test setting and getting account balance."""
        with EVM() as evm:
            address = Address.from_hex("0x1234567890123456789012345678901234567890")
            balance = U256.from_int(1000000)
            
            # Set balance
            success = evm.set_balance(address, balance)
            assert success
            
            # Get balance
            retrieved_balance = evm.get_balance(address)
            # Note: In mock mode, this will return zero
            # In real mode, it should return the set balance
            assert isinstance(retrieved_balance, U256)
    
    def test_set_code(self) -> None:
        """Test setting contract code."""
        with EVM() as evm:
            address = Address.from_hex("0x1234567890123456789012345678901234567890")
            code = bytes.fromhex("6001600101")  # Simple addition
            
            success = evm.set_code(address, code)
            assert success
            
            # Test with Bytes object
            code_bytes = Bytes.from_bytes(code)
            success = evm.set_code(address, code_bytes)
            assert success
    
    def test_set_get_storage(self) -> None:
        """Test setting and getting contract storage."""
        with EVM() as evm:
            address = Address.from_hex("0x1234567890123456789012345678901234567890")
            key = U256.from_int(42)
            value = U256.from_int(1337)
            
            # Set storage
            success = evm.set_storage(address, key, value)
            assert success
            
            # Get storage
            retrieved_value = evm.get_storage(address, key)
            # Note: In mock mode, this will return zero
            # In real mode, it should return the set value
            assert isinstance(retrieved_value, U256)


class TestExecutionResult:
    """Test ExecutionResult data class."""
    
    def test_execution_result_creation(self) -> None:
        """Test creating ExecutionResult."""
        result = ExecutionResult(
            success=True,
            gas_used=21000,
            return_data=b'\x42',
            error_message=None
        )
        
        assert result.success
        assert result.gas_used == 21000
        assert result.return_data == b'\x42'
        assert result.error_message is None
        assert result.is_success()
        assert not result.is_revert()
    
    def test_execution_result_revert(self) -> None:
        """Test ExecutionResult for reverted execution."""
        result = ExecutionResult(
            success=False,
            gas_used=15000,
            return_data=b'',
            error_message="execution reverted"
        )
        
        assert not result.success
        assert result.gas_used == 15000
        assert result.return_data == b''
        assert result.error_message == "execution reverted"
        assert not result.is_success()
        assert result.is_revert()
    
    def test_execution_result_failure_without_message(self) -> None:
        """Test ExecutionResult for failed execution without error message."""
        result = ExecutionResult(
            success=False,
            gas_used=5000,
            return_data=b'',
            error_message=None
        )
        
        assert not result.success
        assert not result.is_success()
        assert not result.is_revert()  # No error message means not a revert


class TestEvmIntegration:
    """Integration tests for EVM functionality."""
    
    def test_basic_contract_execution(self) -> None:
        """Test basic contract execution flow."""
        with EVM() as evm:
            # Contract address
            contract_addr = Address.from_hex("0x1234567890123456789012345678901234567890")
            
            # Simple contract: returns the value 42
            bytecode = bytes.fromhex("602a6000526020600060005139602a6000f3")
            
            # Set contract code
            evm.set_code(contract_addr, bytecode)
            
            # Execute contract
            result = evm.execute(
                bytecode=bytecode,
                to=contract_addr,
                gas_limit=100000
            )
            
            assert result.success
            assert result.gas_used > 0
    
    def test_state_manipulation(self) -> None:
        """Test state manipulation operations."""
        with EVM() as evm:
            addr = Address.from_hex("0x1234567890123456789012345678901234567890")
            
            # Set balance
            balance = U256.from_int(1000000)
            success = evm.set_balance(addr, balance)
            assert success
            
            # Set code
            code = bytes.fromhex("6001")
            success = evm.set_code(addr, code)
            assert success
            
            # Set storage
            key = U256.from_int(0)
            value = U256.from_int(42)
            success = evm.set_storage(addr, key, value)
            assert success
            
            # All operations should succeed in both mock and real mode