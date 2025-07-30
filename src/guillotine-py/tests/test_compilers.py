"""
Tests for Guillotine EVM compiler utilities.
"""

import pytest
from guillotine_evm.compilers import (
    compile_solidity,
    compile_vyper,
    compile_multiple_sources,
    get_compiler_version,
    is_compiler_available,
    CompilerError,
    CompilationResult
)
from guillotine_evm.primitives import Bytes


class TestCompilationResult:
    """Test CompilationResult data class."""
    
    def test_compilation_result_creation(self) -> None:
        """Test creating CompilationResult."""
        bytecode = Bytes.from_hex("0x608060405234801561001057600080fd5b50")
        abi = [{"type": "constructor", "inputs": []}]
        metadata = {"compiler": "solidity", "version": "0.8.19"}
        
        result = CompilationResult(
            bytecode=bytecode,
            abi=abi,
            metadata=metadata
        )
        
        assert result.bytecode == bytecode
        assert result.abi == abi
        assert result.metadata == metadata
    
    def test_get_constructor_bytecode(self) -> None:
        """Test getting constructor bytecode."""
        bytecode = Bytes.from_hex("0x608060405234801561001057600080fd5b50")
        result = CompilationResult(
            bytecode=bytecode,
            abi=[],
            metadata={}
        )
        
        # For now, should just return the original bytecode
        constructor_bytecode = result.get_constructor_bytecode()
        assert constructor_bytecode == bytecode


class TestSolidityCompiler:
    """Test Solidity compilation functionality."""
    
    def test_compile_simple_storage_contract(self) -> None:
        """Test compiling SimpleStorage contract (mock)."""
        source = """
        pragma solidity ^0.8.0;
        contract SimpleStorage {
            uint256 value;
            function set(uint256 _value) public { value = _value; }
            function get() public view returns (uint256) { return value; }
        }
        """
        
        result = compile_solidity(source)
        
        assert isinstance(result, CompilationResult)
        assert isinstance(result.bytecode, Bytes)
        assert len(result.bytecode) > 0
        assert isinstance(result.abi, list)
        assert len(result.abi) > 0
        assert isinstance(result.metadata, dict)
        
        # Check ABI has expected functions
        function_names = [item.get("name") for item in result.abi if item.get("type") == "function"]
        assert "get" in function_names
        assert "set" in function_names
    
    def test_compile_unknown_contract(self) -> None:
        """Test compiling unknown contract should fail."""
        source = """
        pragma solidity ^0.8.0;
        contract UnknownContract {
            // This should fail because it's not SimpleStorage
        }
        """
        
        with pytest.raises(CompilerError, match="not yet implemented"):
            compile_solidity(source)
    
    def test_compile_with_options(self) -> None:
        """Test compiling with options."""
        source = """
        pragma solidity ^0.8.0;
        contract SimpleStorage {
            uint256 value;
        }
        """
        
        # Should not raise an error (but will fail for non-SimpleStorage)
        with pytest.raises(CompilerError):
            compile_solidity(
                source,
                contract_name="SimpleStorage",
                optimizer_runs=1000,
                evm_version="london"
            )


class TestVyperCompiler:
    """Test Vyper compilation functionality."""
    
    def test_compile_vyper_not_implemented(self) -> None:
        """Test Vyper compilation is not yet implemented."""
        source = """
# @version ^0.3.0

value: public(uint256)

@external
def set_value(_value: uint256):
    self.value = _value
        """
        
        with pytest.raises(CompilerError, match="not yet implemented"):
            compile_vyper(source)


class TestMultipleSourceCompilation:
    """Test multiple source compilation."""
    
    def test_compile_multiple_solidity_sources(self) -> None:
        """Test compiling multiple Solidity sources."""
        sources = {
            "SimpleStorage.sol": """
            pragma solidity ^0.8.0;
            contract SimpleStorage {
                uint256 value;
                function set(uint256 _value) public { value = _value; }
                function get() public view returns (uint256) { return value; }
            }
            """,
            "AnotherContract.sol": """
            pragma solidity ^0.8.0;
            contract AnotherContract {
                uint256 data;
            }
            """
        }
        
        # Only SimpleStorage should succeed
        results = {}
        for filename, source in sources.items():
            try:
                result = compile_solidity(source)
                contract_name = filename.split('.')[0]
                results[contract_name] = result
            except CompilerError:
                # Expected for non-SimpleStorage contracts
                pass
        
        assert "SimpleStorage" in results
        assert isinstance(results["SimpleStorage"], CompilationResult)
    
    def test_compile_multiple_unsupported_compiler(self) -> None:
        """Test compiling with unsupported compiler."""
        sources = {"test.rs": "fn main() {}"}
        
        with pytest.raises(CompilerError, match="Unsupported compiler"):
            compile_multiple_sources(sources, compiler="rust")


class TestCompilerInfo:
    """Test compiler information functions."""
    
    def test_get_solidity_compiler_version(self) -> None:
        """Test getting Solidity compiler version."""
        version = get_compiler_version("solidity")
        assert isinstance(version, str)
        assert len(version) > 0
        assert "0.8" in version  # Should include version number
    
    def test_get_vyper_compiler_version(self) -> None:
        """Test getting Vyper compiler version."""
        version = get_compiler_version("vyper")
        assert isinstance(version, str)
        assert len(version) > 0
        assert "0.3" in version  # Should include version number
    
    def test_get_unknown_compiler_version(self) -> None:
        """Test getting version of unknown compiler."""
        with pytest.raises(CompilerError, match="Unknown compiler"):
            get_compiler_version("unknown")
    
    def test_is_solidity_compiler_available(self) -> None:
        """Test checking Solidity compiler availability."""
        # Should return True (even in stub mode)
        available = is_compiler_available("solidity")
        assert isinstance(available, bool)
        assert available  # Stub always returns version
    
    def test_is_vyper_compiler_available(self) -> None:
        """Test checking Vyper compiler availability."""
        # Should return True (even in stub mode)
        available = is_compiler_available("vyper")
        assert isinstance(available, bool)
        assert available  # Stub always returns version
    
    def test_is_unknown_compiler_available(self) -> None:
        """Test checking unknown compiler availability."""
        available = is_compiler_available("unknown")
        assert isinstance(available, bool)
        assert not available  # Should return False for unknown


class TestCompilerIntegration:
    """Integration tests for compiler functionality."""
    
    def test_end_to_end_compilation_flow(self) -> None:
        """Test end-to-end compilation flow."""
        # Check if Solidity is available
        assert is_compiler_available("solidity")
        
        # Get version
        version = get_compiler_version("solidity")
        assert version
        
        # Compile contract
        source = """
        pragma solidity ^0.8.0;
        contract SimpleStorage {
            uint256 value;
            function set(uint256 _value) public { value = _value; }
            function get() public view returns (uint256) { return value; }
        }
        """
        
        result = compile_solidity(source)
        
        # Verify result
        assert result.bytecode
        assert result.abi
        assert result.metadata
        
        # Check metadata includes compiler info
        assert "compiler" in result.metadata
        assert "version" in result.metadata