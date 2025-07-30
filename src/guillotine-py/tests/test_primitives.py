"""
Tests for Guillotine EVM primitive types.
"""

import pytest
from guillotine_evm.primitives import Address, U256, Hash, Bytes
from guillotine_evm.exceptions import InvalidAddressError, InvalidHashError


class TestAddress:
    """Test Address primitive type."""
    
    def test_from_hex_valid(self) -> None:
        """Test creating address from valid hex string."""
        hex_addr = "0x1234567890123456789012345678901234567890"
        addr = Address.from_hex(hex_addr)
        assert addr.to_hex() == hex_addr.lower()
    
    def test_from_hex_without_prefix(self) -> None:
        """Test creating address from hex string without 0x prefix."""
        hex_addr = "1234567890123456789012345678901234567890"
        addr = Address.from_hex(hex_addr)
        assert addr.to_hex() == "0x" + hex_addr.lower()
    
    def test_from_hex_invalid_length(self) -> None:
        """Test creating address from invalid length hex string."""
        with pytest.raises(InvalidAddressError):
            Address.from_hex("0x12345")
    
    def test_from_hex_invalid_chars(self) -> None:
        """Test creating address from hex string with invalid characters."""
        with pytest.raises(InvalidAddressError):
            Address.from_hex("0x123456789012345678901234567890123456789g")
    
    def test_from_bytes_valid(self) -> None:
        """Test creating address from valid bytes."""
        data = b'\x12\x34\x56\x78\x90\x12\x34\x56\x78\x90\x12\x34\x56\x78\x90\x12\x34\x56\x78\x90'
        addr = Address.from_bytes(data)
        assert addr.to_bytes() == data
    
    def test_from_bytes_invalid_length(self) -> None:
        """Test creating address from invalid length bytes."""
        with pytest.raises(InvalidAddressError):
            Address.from_bytes(b'\x12\x34\x56')
    
    def test_zero_address(self) -> None:
        """Test zero address creation and properties."""
        zero = Address.zero()
        assert zero.is_zero()
        assert zero.to_hex() == "0x0000000000000000000000000000000000000000"
        assert zero == Address.ZERO
    
    def test_equality(self) -> None:
        """Test address equality."""
        addr1 = Address.from_hex("0x1234567890123456789012345678901234567890")
        addr2 = Address.from_hex("0x1234567890123456789012345678901234567890")
        addr3 = Address.from_hex("0x0987654321098765432109876543210987654321")
        
        assert addr1 == addr2
        assert addr1 != addr3
        assert hash(addr1) == hash(addr2)
        assert hash(addr1) != hash(addr3)
    
    def test_string_representation(self) -> None:
        """Test string representation."""
        hex_addr = "0x1234567890123456789012345678901234567890"
        addr = Address.from_hex(hex_addr)
        
        assert str(addr) == hex_addr.lower()
        assert repr(addr) == f"Address('{hex_addr.lower()}')"


class TestU256:
    """Test U256 primitive type."""
    
    def test_from_int_valid(self) -> None:
        """Test creating U256 from valid integer."""
        value = 42
        u256 = U256.from_int(value)
        assert u256.to_int() == value
    
    def test_from_int_max_value(self) -> None:
        """Test creating U256 from maximum value."""
        max_val = (1 << 256) - 1
        u256 = U256.from_int(max_val)
        assert u256.to_int() == max_val
    
    def test_from_int_invalid_negative(self) -> None:
        """Test creating U256 from negative integer."""
        with pytest.raises(ValueError):
            U256.from_int(-1)
    
    def test_from_int_invalid_too_large(self) -> None:
        """Test creating U256 from too large integer."""
        with pytest.raises(ValueError):
            U256.from_int(1 << 256)
    
    def test_from_hex_valid(self) -> None:
        """Test creating U256 from valid hex string."""
        hex_val = "0x2a"
        u256 = U256.from_hex(hex_val)
        assert u256.to_int() == 42
    
    def test_from_bytes_valid(self) -> None:
        """Test creating U256 from valid bytes."""
        # 42 in big-endian 32-byte representation
        data = b'\x00' * 31 + b'\x2a'
        u256 = U256.from_bytes(data)
        assert u256.to_int() == 42
    
    def test_zero_and_one(self) -> None:
        """Test zero and one constants."""
        assert U256.zero().is_zero()
        assert U256.zero() == U256.ZERO
        assert U256.one().to_int() == 1
        assert U256.one() == U256.ONE
    
    def test_arithmetic_operations(self) -> None:
        """Test arithmetic operations."""
        a = U256.from_int(10)
        b = U256.from_int(5)
        
        assert (a + b).to_int() == 15
        assert (a - b).to_int() == 5
        assert (a * b).to_int() == 50
        assert (a // b).to_int() == 2
        assert (a % b).to_int() == 0
    
    def test_arithmetic_overflow(self) -> None:
        """Test arithmetic overflow handling."""
        max_val = U256.from_int((1 << 256) - 1)
        one = U256.from_int(1)
        
        # Should wrap around to 0
        result = max_val + one
        assert result.to_int() == 0
    
    def test_comparison_operations(self) -> None:
        """Test comparison operations."""
        a = U256.from_int(10)
        b = U256.from_int(5)
        c = U256.from_int(10)
        
        assert a > b
        assert b < a
        assert a >= c
        assert a <= c
        assert a == c
        assert a != b
    
    def test_division_by_zero(self) -> None:
        """Test division by zero."""
        a = U256.from_int(10)
        zero = U256.zero()
        
        with pytest.raises(ZeroDivisionError):
            a // zero
        
        with pytest.raises(ZeroDivisionError):
            a % zero
    
    def test_hex_conversion(self) -> None:
        """Test hex conversion."""
        u256 = U256.from_int(42)
        hex_str = u256.to_hex()
        
        # Should be 64 hex characters (32 bytes)
        assert len(hex_str) == 66  # Including '0x' prefix
        assert hex_str.startswith('0x')
        assert hex_str.endswith('2a')
    
    def test_bytes_conversion(self) -> None:
        """Test bytes conversion."""
        u256 = U256.from_int(42)
        
        # Big-endian (default)
        bytes_be = u256.to_bytes('big')
        assert len(bytes_be) == 32
        assert bytes_be[-1] == 42
        
        # Little-endian
        bytes_le = u256.to_bytes('little')
        assert len(bytes_le) == 32
        assert bytes_le[0] == 42


class TestHash:
    """Test Hash primitive type."""
    
    def test_from_hex_valid(self) -> None:
        """Test creating hash from valid hex string."""
        hex_hash = "0x1234567890123456789012345678901234567890123456789012345678901234"
        hash_obj = Hash.from_hex(hex_hash)
        assert hash_obj.to_hex() == hex_hash.lower()
    
    def test_from_hex_invalid_length(self) -> None:
        """Test creating hash from invalid length hex string."""
        with pytest.raises(InvalidHashError):
            Hash.from_hex("0x12345")
    
    def test_from_bytes_valid(self) -> None:
        """Test creating hash from valid bytes."""
        data = b'\x12' * 32
        hash_obj = Hash.from_bytes(data)
        assert hash_obj.to_bytes() == data
    
    def test_from_bytes_invalid_length(self) -> None:
        """Test creating hash from invalid length bytes."""
        with pytest.raises(InvalidHashError):
            Hash.from_bytes(b'\x12\x34\x56')
    
    def test_zero_hash(self) -> None:
        """Test zero hash creation and properties."""
        zero = Hash.zero()
        assert zero.is_zero()
        assert zero.to_hex() == "0x" + "00" * 32
        assert zero == Hash.ZERO
    
    def test_equality(self) -> None:
        """Test hash equality."""
        hash1 = Hash.from_hex("0x1234567890123456789012345678901234567890123456789012345678901234")
        hash2 = Hash.from_hex("0x1234567890123456789012345678901234567890123456789012345678901234")
        hash3 = Hash.from_hex("0x0987654321098765432109876543210987654321098765432109876543210987")
        
        assert hash1 == hash2
        assert hash1 != hash3
        assert hash(hash1) == hash(hash2)


class TestBytes:
    """Test Bytes primitive type."""
    
    def test_from_hex_valid(self) -> None:
        """Test creating bytes from valid hex string."""
        hex_str = "0x123456"
        bytes_obj = Bytes.from_hex(hex_str)
        assert bytes_obj.to_hex() == hex_str.lower()
    
    def test_from_hex_odd_length(self) -> None:
        """Test creating bytes from odd length hex string."""
        hex_str = "12345"  # Odd length, should be padded
        bytes_obj = Bytes.from_hex(hex_str)
        assert bytes_obj.to_hex() == "0x012345"
    
    def test_from_bytes_valid(self) -> None:
        """Test creating bytes from raw bytes."""
        data = b'\x12\x34\x56'
        bytes_obj = Bytes.from_bytes(data)
        assert bytes_obj.to_bytes() == data
    
    def test_empty_bytes(self) -> None:
        """Test empty bytes creation and properties."""
        empty = Bytes.empty()
        assert empty.is_empty()
        assert len(empty) == 0
        assert empty.to_hex() == "0x"
        assert empty == Bytes.EMPTY
    
    def test_length(self) -> None:
        """Test bytes length."""
        data = b'\x12\x34\x56'
        bytes_obj = Bytes.from_bytes(data)
        assert len(bytes_obj) == 3
    
    def test_equality(self) -> None:
        """Test bytes equality."""
        bytes1 = Bytes.from_hex("0x123456")
        bytes2 = Bytes.from_hex("0x123456")
        bytes3 = Bytes.from_hex("0x654321")
        
        assert bytes1 == bytes2
        assert bytes1 != bytes3
        assert hash(bytes1) == hash(bytes2)