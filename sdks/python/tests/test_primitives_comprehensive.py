"""
Comprehensive tests for Guillotine EVM primitive types.

Following TDD approach - these tests define the expected behavior.
"""

import pytest
from guillotine_evm import Address, U256, Hash, InvalidAddressError, ValidationError


class TestAddress:
    """Tests for Address primitive type."""
    
    def test_address_from_hex_valid(self):
        """Test creating Address from valid hex string."""
        addr = Address.from_hex("0x1234567890123456789012345678901234567890")
        assert addr.to_hex().lower() == "0x1234567890123456789012345678901234567890"
    
    def test_address_from_hex_without_0x_prefix(self):
        """Test creating Address from hex string without 0x prefix."""
        addr = Address.from_hex("1234567890123456789012345678901234567890")
        assert addr.to_hex().lower() == "0x1234567890123456789012345678901234567890"
    
    def test_address_from_hex_invalid_length(self):
        """Test creating Address from hex string with invalid length."""
        with pytest.raises(InvalidAddressError):
            Address.from_hex("0x1234")  # Too short
        
        with pytest.raises(InvalidAddressError):
            Address.from_hex("0x123456789012345678901234567890123456789012")  # Too long
    
    def test_address_from_hex_invalid_characters(self):
        """Test creating Address from hex string with invalid characters."""
        with pytest.raises(InvalidAddressError):
            Address.from_hex("0x123456789012345678901234567890123456789g")  # Invalid char 'g'
    
    def test_address_from_bytes_valid(self):
        """Test creating Address from 20 bytes."""
        data = b"\x12\x34\x56\x78\x90\x12\x34\x56\x78\x90\x12\x34\x56\x78\x90\x12\x34\x56\x78\x90"
        addr = Address.from_bytes(data)
        assert addr.to_bytes() == data
    
    def test_address_from_bytes_invalid_length(self):
        """Test creating Address from bytes with invalid length."""
        with pytest.raises(InvalidAddressError):
            Address.from_bytes(b"\x12\x34")  # Too short
        
        with pytest.raises(InvalidAddressError):
            Address.from_bytes(b"\x12" * 21)  # Too long
    
    def test_address_zero(self):
        """Test zero address creation."""
        addr = Address.zero()
        assert addr.is_zero()
        assert addr.to_hex() == "0x0000000000000000000000000000000000000000"
    
    def test_address_max(self):
        """Test max address creation."""
        addr = Address.max()
        assert not addr.is_zero()
        assert addr.to_hex() == "0xffffffffffffffffffffffffffffffffffffffff"
    
    def test_address_equality(self):
        """Test address equality comparison."""
        addr1 = Address.from_hex("0x1234567890123456789012345678901234567890")
        addr2 = Address.from_hex("0x1234567890123456789012345678901234567890")
        addr3 = Address.from_hex("0x0987654321098765432109876543210987654321")
        
        assert addr1 == addr2
        assert addr1 != addr3
        assert addr2 != addr3
    
    def test_address_checksum(self):
        """Test EIP-55 checksum address."""
        # Test that checksum is different from lowercase
        addr = Address.from_hex("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed")
        checksum = addr.to_checksum()
        lowercase = addr.to_hex()
        assert checksum != lowercase  # Should have different casing
        assert checksum.startswith("0x")
        assert len(checksum) == 42  # 0x + 40 hex chars
    
    def test_address_is_valid(self):
        """Test address validation."""
        valid_addr = Address.from_hex("0x1234567890123456789012345678901234567890")
        assert valid_addr.is_valid()
        
        zero_addr = Address.zero()
        assert zero_addr.is_valid()  # Zero address is valid
    
    def test_address_arithmetic(self):
        """Test address arithmetic operations."""
        addr = Address.from_hex("0x0000000000000000000000000000000000000001")
        
        # Addition
        addr_plus_one = addr + 1
        assert addr_plus_one.to_hex() == "0x0000000000000000000000000000000000000002"
        
        # Subtraction
        addr_minus_one = addr_plus_one - 1
        assert addr_minus_one == addr
    
    def test_address_string_representation(self):
        """Test address string representation."""
        addr = Address.from_hex("0x1234567890123456789012345678901234567890")
        assert str(addr) == "0x1234567890123456789012345678901234567890"
        assert repr(addr) == "Address('0x1234567890123456789012345678901234567890')"


class TestU256:
    """Tests for U256 primitive type."""
    
    def test_u256_from_int_small(self):
        """Test creating U256 from small integer."""
        val = U256.from_int(42)
        assert val.to_int() == 42
    
    def test_u256_from_int_large(self):
        """Test creating U256 from large integer."""
        large_val = 2**255 - 1  # Max value for signed 256-bit
        val = U256.from_int(large_val)
        assert val.to_int() == large_val
    
    def test_u256_from_int_overflow(self):
        """Test creating U256 from integer that overflows."""
        with pytest.raises(ValidationError):
            U256.from_int(2**256)  # Too large for U256
        
        with pytest.raises(ValidationError):
            U256.from_int(-1)  # Negative not allowed
    
    def test_u256_from_hex(self):
        """Test creating U256 from hex string."""
        val = U256.from_hex("0x1234567890abcdef")
        assert val.to_hex() == "0x1234567890abcdef"
    
    def test_u256_from_hex_full_width(self):
        """Test creating U256 from full-width hex string."""
        hex_val = "0x" + "ff" * 32
        val = U256.from_hex(hex_val)
        assert val.to_hex() == hex_val
    
    def test_u256_from_bytes(self):
        """Test creating U256 from bytes."""
        data = b"\x00" * 31 + b"\x2a"  # 32 bytes, value 42 (0x2a in hex)
        val = U256.from_bytes(data)
        assert val.to_int() == 42
        assert val.to_bytes() == data
    
    def test_u256_from_bytes_big_endian_default(self):
        """Test U256 from bytes uses big-endian by default."""
        data = b"\x01" + b"\x00" * 31  # Big-endian 2^248
        val = U256.from_bytes(data)
        expected = 2**248
        assert val.to_int() == expected
    
    def test_u256_from_bytes_little_endian(self):
        """Test U256 from bytes with little-endian."""
        data = b"\x2a" + b"\x00" * 31  # Little-endian 42 (0x2a in hex)
        val = U256.from_bytes(data, byteorder='little')
        assert val.to_int() == 42
    
    def test_u256_from_ether(self):
        """Test creating U256 from ether amount."""
        val = U256.from_ether(1)
        assert val.to_int() == 10**18  # 1 ether = 10^18 wei
    
    def test_u256_from_gwei(self):
        """Test creating U256 from gwei amount."""
        val = U256.from_gwei(1)
        assert val.to_int() == 10**9  # 1 gwei = 10^9 wei
    
    def test_u256_zero_and_max(self):
        """Test zero and max U256 values."""
        zero = U256.zero()
        assert zero.to_int() == 0
        assert zero.is_zero()
        
        max_val = U256.max()
        assert max_val.to_int() == 2**256 - 1
        assert not max_val.is_zero()
    
    def test_u256_arithmetic_addition(self):
        """Test U256 addition."""
        a = U256.from_int(100)
        b = U256.from_int(50)
        result = a + b
        assert result.to_int() == 150
    
    def test_u256_arithmetic_subtraction(self):
        """Test U256 subtraction."""
        a = U256.from_int(100)
        b = U256.from_int(50)
        result = a - b
        assert result.to_int() == 50
    
    def test_u256_arithmetic_subtraction_underflow(self):
        """Test U256 subtraction underflow wraps around."""
        a = U256.from_int(50)
        b = U256.from_int(100)
        result = a - b  # Should wrap around
        expected = 2**256 - 50  # EVM wrapping behavior
        assert result.to_int() == expected
    
    def test_u256_arithmetic_multiplication(self):
        """Test U256 multiplication."""
        a = U256.from_int(12)
        b = U256.from_int(8)
        result = a * b
        assert result.to_int() == 96
    
    def test_u256_arithmetic_division(self):
        """Test U256 division."""
        a = U256.from_int(100)
        b = U256.from_int(10)
        result = a // b  # Floor division
        assert result.to_int() == 10
    
    def test_u256_arithmetic_division_by_zero(self):
        """Test U256 division by zero returns zero (EVM behavior)."""
        a = U256.from_int(100)
        b = U256.zero()
        result = a // b
        assert result.is_zero()  # EVM returns 0 for division by zero
    
    def test_u256_arithmetic_modulo(self):
        """Test U256 modulo operation."""
        a = U256.from_int(17)
        b = U256.from_int(5)
        result = a % b
        assert result.to_int() == 2
    
    def test_u256_arithmetic_modulo_by_zero(self):
        """Test U256 modulo by zero returns zero (EVM behavior)."""
        a = U256.from_int(100)
        b = U256.zero()
        result = a % b
        assert result.is_zero()  # EVM returns 0 for modulo by zero
    
    def test_u256_arithmetic_exponentiation(self):
        """Test U256 exponentiation."""
        base = U256.from_int(2)
        exp = U256.from_int(10)
        result = base ** exp
        assert result.to_int() == 1024
    
    def test_u256_comparison_equality(self):
        """Test U256 equality comparison."""
        a = U256.from_int(42)
        b = U256.from_int(42)
        c = U256.from_int(43)
        
        assert a == b
        assert a != c
        assert b != c
    
    def test_u256_comparison_ordering(self):
        """Test U256 ordering comparisons."""
        a = U256.from_int(10)
        b = U256.from_int(20)
        
        assert a < b
        assert b > a
        assert a <= b
        assert b >= a
        assert a <= a  # Equal case
        assert a >= a  # Equal case
    
    def test_u256_bitwise_and(self):
        """Test U256 bitwise AND."""
        a = U256.from_int(0b1100)  # 12
        b = U256.from_int(0b1010)  # 10
        result = a & b
        assert result.to_int() == 0b1000  # 8
    
    def test_u256_bitwise_or(self):
        """Test U256 bitwise OR."""
        a = U256.from_int(0b1100)  # 12
        b = U256.from_int(0b1010)  # 10
        result = a | b
        assert result.to_int() == 0b1110  # 14
    
    def test_u256_bitwise_xor(self):
        """Test U256 bitwise XOR."""
        a = U256.from_int(0b1100)  # 12
        b = U256.from_int(0b1010)  # 10
        result = a ^ b
        assert result.to_int() == 0b0110  # 6
    
    def test_u256_bitwise_not(self):
        """Test U256 bitwise NOT."""
        a = U256.from_int(0)
        result = ~a
        assert result.to_int() == 2**256 - 1  # All bits set
    
    def test_u256_shift_left(self):
        """Test U256 left shift."""
        val = U256.from_int(1)
        result = val << 8
        assert result.to_int() == 256
    
    def test_u256_shift_right(self):
        """Test U256 right shift."""
        val = U256.from_int(256)
        result = val >> 8
        assert result.to_int() == 1
    
    def test_u256_to_ether(self):
        """Test U256 conversion to ether."""
        wei_amount = U256.from_int(10**18)
        ether_amount = wei_amount.to_ether()
        assert ether_amount == 1.0
    
    def test_u256_to_gwei(self):
        """Test U256 conversion to gwei."""
        wei_amount = U256.from_int(10**9)
        gwei_amount = wei_amount.to_gwei()
        assert gwei_amount == 1.0
    
    def test_u256_string_representation(self):
        """Test U256 string representation."""
        val = U256.from_int(42)
        assert str(val) == "42"
        assert repr(val) == "U256(42)"


class TestHash:
    """Tests for Hash primitive type."""
    
    def test_hash_from_hex(self):
        """Test creating Hash from hex string."""
        hex_str = "0x" + "12" * 32
        hash_val = Hash.from_hex(hex_str)
        assert hash_val.to_hex() == hex_str
    
    def test_hash_from_hex_invalid_length(self):
        """Test creating Hash from invalid length hex string."""
        with pytest.raises(ValidationError):
            Hash.from_hex("0x1234")  # Too short
    
    def test_hash_from_bytes(self):
        """Test creating Hash from bytes."""
        data = b"\x12" * 32
        hash_val = Hash.from_bytes(data)
        assert hash_val.to_bytes() == data
    
    def test_hash_from_bytes_invalid_length(self):
        """Test creating Hash from invalid length bytes."""
        with pytest.raises(ValidationError):
            Hash.from_bytes(b"\x12" * 31)  # Too short
    
    def test_hash_zero(self):
        """Test zero hash."""
        hash_val = Hash.zero()
        assert hash_val.is_zero()
        assert hash_val.to_hex() == "0x" + "00" * 32
    
    def test_hash_keccak256(self):
        """Test Keccak256 hash function."""
        data = b"Hello, Ethereum!"
        hash_val = Hash.keccak256(data)
        assert not hash_val.is_zero()
        assert len(hash_val.to_bytes()) == 32
        
        # Hash should be deterministic
        hash_val2 = Hash.keccak256(data)
        assert hash_val == hash_val2
    
    def test_hash_keccak256_empty(self):
        """Test Keccak256 of empty data."""
        empty_hash = Hash.keccak256(b"")
        expected_hex = "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"
        assert empty_hash.to_hex() == expected_hex
    
    def test_hash_equality(self):
        """Test hash equality."""
        data = b"\x12" * 32
        hash1 = Hash.from_bytes(data)
        hash2 = Hash.from_bytes(data)
        hash3 = Hash.from_bytes(b"\x34" * 32)
        
        assert hash1 == hash2
        assert hash1 != hash3
    
    def test_hash_string_representation(self):
        """Test hash string representation."""
        hex_str = "0x" + "12" * 32
        hash_val = Hash.from_hex(hex_str)
        assert str(hash_val) == hex_str
        assert repr(hash_val) == f"Hash('{hex_str}')"


# Integration tests
class TestPrimitivesIntegration:
    """Integration tests for primitive types working together."""
    
    def test_address_and_u256_in_mapping(self):
        """Test using Address as key and U256 as value in mapping."""
        # Simulate a balance mapping
        balances = {}
        
        addr1 = Address.from_hex("0x1234567890123456789012345678901234567890")
        addr2 = Address.from_hex("0x0987654321098765432109876543210987654321")
        
        balances[addr1] = U256.from_ether(10)
        balances[addr2] = U256.from_ether(5)
        
        assert balances[addr1].to_ether() == 10.0
        assert balances[addr2].to_ether() == 5.0
    
    def test_hash_as_identifier(self):
        """Test using Hash as identifier."""
        data1 = b"Transaction 1"
        data2 = b"Transaction 2"
        
        tx_hash1 = Hash.keccak256(data1)
        tx_hash2 = Hash.keccak256(data2)
        
        # Simulate transaction storage
        transactions = {
            tx_hash1: {"from": Address.from_hex("0x1234567890123456789012345678901234567890"), "value": U256.from_ether(1)},
            tx_hash2: {"from": Address.from_hex("0x0987654321098765432109876543210987654321"), "value": U256.from_ether(2)},
        }
        
        assert tx_hash1 in transactions
        assert tx_hash2 in transactions
        assert transactions[tx_hash1]["value"].to_ether() == 1.0
        assert transactions[tx_hash2]["value"].to_ether() == 2.0