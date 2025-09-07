#!/usr/bin/env python3
"""
Example usage of Guillotine EVM Python bindings.

This file demonstrates various features of the Python bindings.
"""

from guillotine_evm import EVM, Address, U256, Hash, Bytes
from guillotine_evm.compilers import compile_solidity, CompilerError
from guillotine_evm.exceptions import ExecutionError


def basic_evm_usage():
    """Demonstrate basic EVM usage."""
    print("=== Basic EVM Usage ===")
    
    # Create an EVM instance
    with EVM() as evm:
        print("EVM initialized successfully")
        
        # Simple bytecode: PUSH1 42, PUSH1 0, RETURN (returns 42)
        bytecode = bytes.fromhex("602a6000f3")
        
        # Execute bytecode
        result = evm.execute(
            bytecode=bytecode,
            gas_limit=100000
        )
        
        print(f"Execution successful: {result.success}")
        print(f"Gas used: {result.gas_used}")
        print(f"Return data: {result.return_data.hex()}")
        
        if result.error_message:
            print(f"Error: {result.error_message}")


def primitives_usage():
    """Demonstrate primitive type usage."""
    print("\n=== Primitives Usage ===")
    
    # Address examples
    addr1 = Address.from_hex("0x1234567890123456789012345678901234567890")
    addr2 = Address.zero()
    
    print(f"Address 1: {addr1}")
    print(f"Address 2 (zero): {addr2}")
    print(f"Address 1 is zero: {addr1.is_zero()}")
    print(f"Address 2 is zero: {addr2.is_zero()}")
    
    # U256 examples
    num1 = U256.from_int(42)
    num2 = U256.from_hex("0x2a")
    num3 = num1 + num2
    
    print(f"Number 1: {num1}")
    print(f"Number 2: {num2}")
    print(f"Sum: {num3}")
    print(f"Are they equal: {num1 == num2}")
    
    # Hash examples
    hash1 = Hash.from_hex("0x1234567890123456789012345678901234567890123456789012345678901234")
    hash2 = Hash.zero()
    
    print(f"Hash 1: {hash1}")
    print(f"Hash 2 (zero): {hash2}")
    
    # Bytes examples
    bytes1 = Bytes.from_hex("0x123456")
    bytes2 = Bytes.from_bytes(b'\x12\x34\x56')
    
    print(f"Bytes 1: {bytes1}")
    print(f"Bytes 2: {bytes2}")
    print(f"Are they equal: {bytes1 == bytes2}")


def state_management():
    """Demonstrate EVM state management."""
    print("\n=== State Management ===")
    
    with EVM() as evm:
        addr = Address.from_hex("0x1234567890123456789012345678901234567890")
        
        # Set balance
        balance = U256.from_int(1000000)
        success = evm.set_balance(addr, balance)
        print(f"Set balance success: {success}")
        
        # Get balance
        retrieved_balance = evm.get_balance(addr)
        print(f"Retrieved balance: {retrieved_balance}")
        
        # Set code
        code = bytes.fromhex("6001600101")  # PUSH1 1, PUSH1 1, ADD
        success = evm.set_code(addr, code)
        print(f"Set code success: {success}")
        
        # Set storage
        key = U256.from_int(0)
        value = U256.from_int(42)
        success = evm.set_storage(addr, key, value)
        print(f"Set storage success: {success}")
        
        # Get storage  
        retrieved_value = evm.get_storage(addr, key)
        print(f"Retrieved storage value: {retrieved_value}")


def contract_execution():
    """Demonstrate contract execution."""
    print("\n=== Contract Execution ===")
    
    with EVM() as evm:
        # Contract and caller addresses
        contract_addr = Address.from_hex("0x1234567890123456789012345678901234567890")
        caller_addr = Address.from_hex("0x9876543210987654321098765432109876543210")
        
        # Contract bytecode (simple addition: takes two values from stack and adds them)
        bytecode = bytes.fromhex("6001600101")  # PUSH1 1, PUSH1 1, ADD
        
        # Set contract code
        evm.set_code(contract_addr, bytecode)
        
        # Execute contract with value transfer
        value = U256.from_int(1000)
        result = evm.execute(
            bytecode=bytecode,
            caller=caller_addr,
            to=contract_addr,
            value=value,
            gas_limit=50000
        )
        
        print(f"Contract execution successful: {result.success}")
        print(f"Gas used: {result.gas_used}")
        print(f"Return data: {result.return_data.hex()}")


def compiler_usage():
    """Demonstrate compiler usage."""
    print("\n=== Compiler Usage ===")
    
    try:
        # Simple Solidity contract
        source = """
        pragma solidity ^0.8.0;
        contract SimpleStorage {
            uint256 value;
            function set(uint256 _value) public { value = _value; }
            function get() public view returns (uint256) { return value; }
        }
        """
        
        # Compile the contract
        result = compile_solidity(source)
        
        print(f"Compilation successful!")
        print(f"Bytecode length: {len(result.bytecode)} bytes")
        print(f"ABI functions: {len(result.abi)}")
        print(f"Compiler: {result.metadata.get('compiler', 'unknown')}")
        
        # Display ABI
        for item in result.abi:
            if item.get("type") == "function":
                print(f"Function: {item.get('name')}")
        
    except CompilerError as e:
        print(f"Compilation failed: {e}")


def error_handling():
    """Demonstrate error handling."""
    print("\n=== Error Handling ===")
    
    # Invalid address
    try:
        invalid_addr = Address.from_hex("0x123")  # Too short
    except Exception as e:
        print(f"Invalid address error: {e}")
    
    # Invalid U256
    try:
        invalid_u256 = U256.from_int(-1)  # Negative
    except Exception as e:
        print(f"Invalid U256 error: {e}")
    
    # EVM execution error
    try:
        with EVM() as evm:
            # Empty bytecode should fail
            result = evm.execute(bytecode=b'', gas_limit=50000)
    except Exception as e:
        print(f"Execution error: {e}")


def advanced_arithmetic():
    """Demonstrate advanced U256 arithmetic."""
    print("\n=== Advanced Arithmetic ===")
    
    # Large numbers
    a = U256.from_hex("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")  # Max U256
    b = U256.from_int(1)
    
    print(f"Max U256: {a}")
    print(f"Max + 1 (overflow): {a + b}")  # Should wrap to 0
    
    # Division and modulo
    dividend = U256.from_int(100)
    divisor = U256.from_int(7)
    
    quotient = dividend // divisor
    remainder = dividend % divisor
    
    print(f"{dividend} / {divisor} = {quotient}")
    print(f"{dividend} % {divisor} = {remainder}")
    
    # Comparison
    print(f"{dividend} > {divisor}: {dividend > divisor}")
    print(f"{dividend} == {divisor}: {dividend == divisor}")


def bytes_manipulation():
    """Demonstrate bytes manipulation."""
    print("\n=== Bytes Manipulation ===")
    
    # Create bytes from different sources
    bytes1 = Bytes.from_hex("0x123456789abc")
    bytes2 = Bytes.from_bytes(b'\x12\x34\x56\x78\x9a\xbc')
    
    print(f"Bytes from hex: {bytes1}")
    print(f"Bytes from raw: {bytes2}")
    print(f"Are equal: {bytes1 == bytes2}")
    print(f"Length: {len(bytes1)}")
    
    # Empty bytes
    empty = Bytes.empty()
    print(f"Empty bytes: {empty}")
    print(f"Is empty: {empty.is_empty()}")


def main():
    """Run all examples."""
    print("Guillotine EVM Python Bindings Examples")
    print("=" * 50)
    
    try:
        primitives_usage()
        basic_evm_usage()
        state_management()
        contract_execution()
        compiler_usage()
        error_handling()
        advanced_arithmetic()
        bytes_manipulation()
        
        print("\n=== All Examples Completed Successfully! ===")
        
    except Exception as e:
        print(f"\nExample failed with error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()