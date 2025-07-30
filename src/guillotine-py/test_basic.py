#!/usr/bin/env python3
"""
Basic test script to verify Python bindings are working.
"""

def test_import():
    """Test basic import functionality."""
    try:
        import guillotine_evm
        print("✅ Successfully imported guillotine_evm")
        return True
    except ImportError as e:
        print(f"❌ Failed to import guillotine_evm: {e}")
        return False

def test_primitives():
    """Test primitive types."""
    try:
        from guillotine_evm import Address, U256, Hash, Bytes
        
        # Test Address
        addr = Address.from_hex("0x1234567890123456789012345678901234567890")
        assert str(addr) == "0x1234567890123456789012345678901234567890"
        
        # Test U256
        num = U256.from_int(42)
        assert num.to_int() == 42
        
        # Test arithmetic
        result = num + U256.from_int(8)
        assert result.to_int() == 50
        
        # Test Hash
        hash_val = Hash.from_hex("0x1234567890123456789012345678901234567890123456789012345678901234")
        assert len(hash_val.to_bytes()) == 32
        
        # Test Bytes
        bytes_val = Bytes.from_hex("0x123456")
        assert len(bytes_val) == 3
        
        print("✅ Primitives tests passed")
        return True
    except Exception as e:
        print(f"❌ Primitives tests failed: {e}")
        return False

def test_evm():
    """Test EVM functionality."""
    try:
        from guillotine_evm import EVM
        
        with EVM() as evm:
            # Simple bytecode execution
            bytecode = bytes.fromhex("6001")  # PUSH1 1
            result = evm.execute(bytecode=bytecode, gas_limit=50000)
            
            assert result.success
            assert result.gas_used > 0
            
            print("✅ EVM tests passed")
            return True
    except Exception as e:
        print(f"❌ EVM tests failed: {e}")
        return False

def test_compilers():
    """Test compiler functionality."""
    try:
        from guillotine_evm.compilers import compile_solidity, is_compiler_available
        
        # Check if compiler is available
        available = is_compiler_available("solidity")
        assert available
        
        # Test mock compilation
        source = """
        pragma solidity ^0.8.0;
        contract SimpleStorage {
            uint256 value;
            function set(uint256 _value) public { value = _value; }
            function get() public view returns (uint256) { return value; }
        }
        """
        
        result = compile_solidity(source)
        assert len(result.bytecode) > 0
        assert len(result.abi) > 0
        
        print("✅ Compiler tests passed")
        return True
    except Exception as e:
        print(f"❌ Compiler tests failed: {e}")
        return False

def main():
    """Run all tests."""
    print("Running Guillotine EVM Python Bindings Basic Tests")
    print("=" * 50)
    
    tests = [
        ("Import", test_import),
        ("Primitives", test_primitives), 
        ("EVM", test_evm),
        ("Compilers", test_compilers),
    ]
    
    passed = 0
    total = len(tests)
    
    for name, test_func in tests:
        print(f"\nTesting {name}...")
        if test_func():
            passed += 1
        
    print(f"\n{'='*50}")
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed!")
        return 0
    else:
        print("💥 Some tests failed")
        return 1

if __name__ == "__main__":
    exit(main())