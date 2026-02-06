"""Tests for Bytecode module."""

import pytest
from voltaire.bytecode import Bytecode
from voltaire.errors import InvalidHexError


class TestConstructors:
    """Tests for Bytecode constructors."""

    def test_from_bytes(self):
        """Create bytecode from raw bytes."""
        code = bytes([0x60, 0x00, 0x5b, 0x00])  # PUSH1 0x00, JUMPDEST, STOP
        bytecode = Bytecode(code)
        assert len(bytecode) == 4
        assert bytecode.to_bytes() == code

    def test_from_hex_with_prefix(self):
        """Create bytecode from hex string with 0x prefix."""
        bytecode = Bytecode.from_hex("0x60005b00")
        assert len(bytecode) == 4
        assert bytecode.to_bytes() == bytes([0x60, 0x00, 0x5b, 0x00])

    def test_from_hex_without_prefix(self):
        """Create bytecode from hex string without prefix."""
        bytecode = Bytecode.from_hex("60005b00")
        assert len(bytecode) == 4
        assert bytecode.to_bytes() == bytes([0x60, 0x00, 0x5b, 0x00])

    def test_from_hex_uppercase(self):
        """Create bytecode from uppercase hex string."""
        bytecode = Bytecode.from_hex("0x60005B00")
        assert len(bytecode) == 4

    def test_from_hex_empty(self):
        """Create bytecode from empty hex string."""
        bytecode = Bytecode.from_hex("0x")
        assert len(bytecode) == 0

    def test_from_bytes_empty(self):
        """Create bytecode from empty bytes."""
        bytecode = Bytecode(b"")
        assert len(bytecode) == 0

    def test_from_hex_invalid_characters(self):
        """Reject hex with invalid characters."""
        with pytest.raises(InvalidHexError):
            Bytecode.from_hex("0x60gg5b00")

    def test_from_hex_odd_length(self):
        """Reject odd-length hex string."""
        with pytest.raises(InvalidHexError):
            Bytecode.from_hex("0x605b0")


class TestIsBoundary:
    """Tests for Bytecode.is_boundary method."""

    def test_simple_opcodes(self):
        """Simple opcodes are all boundaries."""
        # STOP, ADD, STOP
        bytecode = Bytecode(bytes([0x00, 0x01, 0x00]))
        assert bytecode.is_boundary(0) is True
        assert bytecode.is_boundary(1) is True
        assert bytecode.is_boundary(2) is True

    def test_push1_data_not_boundary(self):
        """PUSH1 immediate data is not a boundary."""
        # PUSH1 0x00, JUMPDEST, STOP
        bytecode = Bytecode(bytes([0x60, 0x00, 0x5b, 0x00]))
        assert bytecode.is_boundary(0) is True   # PUSH1 opcode
        assert bytecode.is_boundary(1) is False  # Inside PUSH1 data
        assert bytecode.is_boundary(2) is True   # JUMPDEST
        assert bytecode.is_boundary(3) is True   # STOP

    def test_push2_data_not_boundary(self):
        """PUSH2 immediate data bytes are not boundaries."""
        # PUSH2 0x0102, STOP
        bytecode = Bytecode(bytes([0x61, 0x01, 0x02, 0x00]))
        assert bytecode.is_boundary(0) is True   # PUSH2 opcode
        assert bytecode.is_boundary(1) is False  # Data byte 1
        assert bytecode.is_boundary(2) is False  # Data byte 2
        assert bytecode.is_boundary(3) is True   # STOP

    def test_push32_data_not_boundary(self):
        """PUSH32 immediate data (32 bytes) are not boundaries."""
        # PUSH32 <32 bytes of 0xff>, STOP
        code = bytes([0x7f] + [0xff] * 32 + [0x00])
        bytecode = Bytecode(code)
        assert bytecode.is_boundary(0) is True   # PUSH32 opcode
        for i in range(1, 33):
            assert bytecode.is_boundary(i) is False  # Data bytes
        assert bytecode.is_boundary(33) is True  # STOP

    def test_out_of_bounds_position(self):
        """Position beyond bytecode length returns False."""
        bytecode = Bytecode(bytes([0x60, 0x00, 0x00]))
        assert bytecode.is_boundary(3) is False
        assert bytecode.is_boundary(100) is False

    def test_empty_bytecode(self):
        """Empty bytecode: all positions are out of bounds."""
        bytecode = Bytecode(b"")
        assert bytecode.is_boundary(0) is False


class TestIsValidJumpdest:
    """Tests for Bytecode.is_valid_jumpdest method."""

    def test_valid_jumpdest(self):
        """JUMPDEST at instruction boundary is valid."""
        # PUSH1 0x00, JUMPDEST, STOP
        bytecode = Bytecode(bytes([0x60, 0x00, 0x5b, 0x00]))
        assert bytecode.is_valid_jumpdest(2) is True

    def test_jumpdest_in_push_data_invalid(self):
        """JUMPDEST opcode inside PUSH data is NOT valid."""
        # PUSH1 0x5b (0x5b is JUMPDEST opcode but here it's data)
        # JUMPDEST (actual valid jump destination)
        bytecode = Bytecode(bytes([0x60, 0x5b, 0x5b]))
        assert bytecode.is_valid_jumpdest(1) is False  # Inside PUSH data
        assert bytecode.is_valid_jumpdest(2) is True   # Actual JUMPDEST

    def test_non_jumpdest_opcode_invalid(self):
        """Non-JUMPDEST opcodes are not valid jump destinations."""
        # PUSH1 0x00, ADD, STOP
        bytecode = Bytecode(bytes([0x60, 0x00, 0x01, 0x00]))
        assert bytecode.is_valid_jumpdest(0) is False  # PUSH1
        assert bytecode.is_valid_jumpdest(2) is False  # ADD
        assert bytecode.is_valid_jumpdest(3) is False  # STOP

    def test_multiple_jumpdests(self):
        """Multiple consecutive JUMPDESTs are all valid."""
        # JUMPDEST, JUMPDEST, JUMPDEST, STOP
        bytecode = Bytecode(bytes([0x5b, 0x5b, 0x5b, 0x00]))
        assert bytecode.is_valid_jumpdest(0) is True
        assert bytecode.is_valid_jumpdest(1) is True
        assert bytecode.is_valid_jumpdest(2) is True
        assert bytecode.is_valid_jumpdest(3) is False  # STOP

    def test_jumpdest_at_start(self):
        """JUMPDEST at position 0 is valid."""
        bytecode = Bytecode(bytes([0x5b, 0x00]))
        assert bytecode.is_valid_jumpdest(0) is True

    def test_out_of_bounds_position(self):
        """Position beyond bytecode returns False."""
        bytecode = Bytecode(bytes([0x5b, 0x00]))
        assert bytecode.is_valid_jumpdest(2) is False
        assert bytecode.is_valid_jumpdest(100) is False

    def test_empty_bytecode(self):
        """Empty bytecode has no valid jump destinations."""
        bytecode = Bytecode(b"")
        assert bytecode.is_valid_jumpdest(0) is False

    def test_push32_with_embedded_jumpdests(self):
        """JUMPDEST bytes inside PUSH32 data are not valid."""
        # PUSH32 <32 bytes with 0x5b scattered>, JUMPDEST
        code = [0x7f]  # PUSH32
        for i in range(32):
            code.append(0x5b if i % 2 == 0 else 0x00)
        code.append(0x5b)  # Actual JUMPDEST after PUSH32
        bytecode = Bytecode(bytes(code))

        # All positions 1-32 are inside PUSH32 data
        for i in range(1, 33):
            assert bytecode.is_valid_jumpdest(i) is False

        # Position 33 is the actual JUMPDEST
        assert bytecode.is_valid_jumpdest(33) is True


class TestValidate:
    """Tests for Bytecode.validate method."""

    def test_valid_simple_bytecode(self):
        """Simple valid bytecode passes validation."""
        # PUSH1 0x00, STOP
        bytecode = Bytecode(bytes([0x60, 0x00, 0x00]))
        assert bytecode.validate() is True

    def test_valid_with_jumpdest(self):
        """Bytecode with JUMPDEST is valid."""
        # PUSH1 0x00, JUMPDEST, STOP
        bytecode = Bytecode(bytes([0x60, 0x00, 0x5b, 0x00]))
        assert bytecode.validate() is True

    def test_valid_push32(self):
        """Complete PUSH32 is valid."""
        code = bytes([0x7f] + [0x00] * 32 + [0x00])  # PUSH32 + 32 bytes + STOP
        bytecode = Bytecode(code)
        assert bytecode.validate() is True

    def test_invalid_truncated_push1(self):
        """Truncated PUSH1 (no data) is invalid."""
        bytecode = Bytecode(bytes([0x60]))  # PUSH1 with no data
        assert bytecode.validate() is False

    def test_invalid_truncated_push2(self):
        """Truncated PUSH2 (incomplete data) is invalid."""
        bytecode = Bytecode(bytes([0x61, 0x00]))  # PUSH2 with only 1 byte
        assert bytecode.validate() is False

    def test_invalid_truncated_push32(self):
        """Truncated PUSH32 (incomplete data) is invalid."""
        code = bytes([0x7f] + [0x00] * 31)  # PUSH32 with only 31 bytes
        bytecode = Bytecode(code)
        assert bytecode.validate() is False

    def test_valid_empty_bytecode(self):
        """Empty bytecode is valid (no incomplete PUSH instructions)."""
        bytecode = Bytecode(b"")
        assert bytecode.validate() is True

    def test_valid_only_simple_opcodes(self):
        """Bytecode with only simple opcodes is valid."""
        # ADD, SUB, MUL, STOP
        bytecode = Bytecode(bytes([0x01, 0x03, 0x02, 0x00]))
        assert bytecode.validate() is True

    def test_valid_multiple_pushes(self):
        """Multiple complete PUSH instructions are valid."""
        # PUSH1 0x01, PUSH2 0x0102, PUSH4 0x01020304, STOP
        bytecode = Bytecode(bytes([
            0x60, 0x01,              # PUSH1
            0x61, 0x01, 0x02,        # PUSH2
            0x63, 0x01, 0x02, 0x03, 0x04,  # PUSH4
            0x00                     # STOP
        ]))
        assert bytecode.validate() is True


class TestGetNextPc:
    """Tests for Bytecode.get_next_pc method."""

    def test_simple_opcode_advances_by_one(self):
        """Simple opcodes advance PC by 1."""
        # ADD, SUB, STOP
        bytecode = Bytecode(bytes([0x01, 0x03, 0x00]))
        assert bytecode.get_next_pc(0) == 1
        assert bytecode.get_next_pc(1) == 2
        assert bytecode.get_next_pc(2) == 3

    def test_push1_skips_data(self):
        """PUSH1 advances PC by 2 (opcode + 1 byte data)."""
        # PUSH1 0x00, STOP
        bytecode = Bytecode(bytes([0x60, 0x00, 0x00]))
        assert bytecode.get_next_pc(0) == 2

    def test_push2_skips_data(self):
        """PUSH2 advances PC by 3 (opcode + 2 bytes data)."""
        # PUSH2 0x0102, STOP
        bytecode = Bytecode(bytes([0x61, 0x01, 0x02, 0x00]))
        assert bytecode.get_next_pc(0) == 3

    def test_push32_skips_data(self):
        """PUSH32 advances PC by 33 (opcode + 32 bytes data)."""
        code = bytes([0x7f] + [0x00] * 32 + [0x00])
        bytecode = Bytecode(code)
        assert bytecode.get_next_pc(0) == 33

    def test_at_end_returns_negative_one(self):
        """Returns -1 when at end of bytecode."""
        # STOP
        bytecode = Bytecode(bytes([0x00]))
        assert bytecode.get_next_pc(0) == 1
        assert bytecode.get_next_pc(1) == -1

    def test_beyond_end_returns_negative_one(self):
        """Returns -1 when beyond end of bytecode."""
        bytecode = Bytecode(bytes([0x00]))
        assert bytecode.get_next_pc(5) == -1
        assert bytecode.get_next_pc(100) == -1

    def test_empty_bytecode(self):
        """Empty bytecode always returns -1."""
        bytecode = Bytecode(b"")
        assert bytecode.get_next_pc(0) == -1

    def test_walk_through_bytecode(self):
        """Walk through entire bytecode using get_next_pc."""
        # PUSH1 0x00, PUSH2 0x0102, JUMPDEST, STOP
        bytecode = Bytecode(bytes([0x60, 0x00, 0x61, 0x01, 0x02, 0x5b, 0x00]))

        positions = []
        pc = 0
        while pc != -1 and pc < len(bytecode):
            positions.append(pc)
            pc = bytecode.get_next_pc(pc)

        assert positions == [0, 2, 5, 6]  # PUSH1, PUSH2, JUMPDEST, STOP


class TestAnalyzeJumpdests:
    """Tests for Bytecode.analyze_jumpdests method."""

    def test_single_jumpdest(self):
        """Find single JUMPDEST."""
        # PUSH1 0x00, JUMPDEST, STOP
        bytecode = Bytecode(bytes([0x60, 0x00, 0x5b, 0x00]))
        bytecode.analyze_jumpdests()
        assert bytecode.is_valid_jumpdest(2) is True

    def test_no_jumpdests(self):
        """Bytecode with no JUMPDESTs."""
        # PUSH1 0x00, ADD, STOP
        bytecode = Bytecode(bytes([0x60, 0x00, 0x01, 0x00]))
        bytecode.analyze_jumpdests()
        for i in range(4):
            assert bytecode.is_valid_jumpdest(i) is False

    def test_analyze_caches_result(self):
        """analyze_jumpdests caches its result."""
        bytecode = Bytecode(bytes([0x60, 0x00, 0x5b, 0x00]))
        result1 = bytecode.analyze_jumpdests()
        result2 = bytecode.analyze_jumpdests()
        # Both calls should return the same cached result
        assert result1 == result2


class TestProtocols:
    """Tests for Python protocol support."""

    def test_len(self):
        """len() returns bytecode length."""
        bytecode = Bytecode(bytes([0x60, 0x00, 0x5b, 0x00]))
        assert len(bytecode) == 4

    def test_len_empty(self):
        """len() of empty bytecode is 0."""
        bytecode = Bytecode(b"")
        assert len(bytecode) == 0

    def test_bytes_conversion(self):
        """bytes() returns raw bytecode."""
        code = bytes([0x60, 0x00, 0x5b, 0x00])
        bytecode = Bytecode(code)
        assert bytes(bytecode) == code

    def test_to_bytes(self):
        """to_bytes() returns raw bytecode."""
        code = bytes([0x60, 0x00, 0x5b, 0x00])
        bytecode = Bytecode(code)
        assert bytecode.to_bytes() == code

    def test_repr(self):
        """repr() shows bytecode info."""
        bytecode = Bytecode(bytes([0x60, 0x00, 0x5b, 0x00]))
        r = repr(bytecode)
        assert "Bytecode" in r
        assert "4" in r  # Length

    def test_str(self):
        """str() shows hex representation."""
        bytecode = Bytecode(bytes([0x60, 0x00, 0x5b, 0x00]))
        s = str(bytecode)
        assert "60005b00" in s.lower()


class TestEdgeCases:
    """Tests for edge cases and special scenarios."""

    def test_push_at_end_with_exact_data(self):
        """PUSH with exact data bytes at end."""
        # PUSH1 0xff (exactly 2 bytes, no STOP)
        bytecode = Bytecode(bytes([0x60, 0xff]))
        assert bytecode.validate() is True
        assert bytecode.is_boundary(0) is True
        assert bytecode.is_boundary(1) is False
        assert bytecode.get_next_pc(0) == 2

    def test_all_push_sizes(self):
        """Test all PUSH sizes (PUSH1 through PUSH32) are boundaries."""
        for push_size in range(1, 33):
            opcode = 0x5f + push_size  # PUSH1=0x60, PUSH32=0x7f
            code = bytes([opcode] + [0x00] * push_size)
            bytecode = Bytecode(code)

            assert bytecode.is_boundary(0) is True
            for i in range(1, push_size + 1):
                assert bytecode.is_boundary(i) is False
            assert bytecode.validate() is True

    def test_nested_push_patterns(self):
        """PUSH containing another PUSH opcode as data."""
        # PUSH2 0x60ff (contains PUSH1 opcode 0x60 as data), STOP
        bytecode = Bytecode(bytes([0x61, 0x60, 0xff, 0x00]))
        assert bytecode.is_boundary(0) is True   # PUSH2
        assert bytecode.is_boundary(1) is False  # 0x60 is data, not PUSH1
        assert bytecode.is_boundary(2) is False  # 0xff is data
        assert bytecode.is_boundary(3) is True   # STOP
