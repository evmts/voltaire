"""
Tests for SignatureUtils module.
"""

import pytest
from voltaire.signature import SignatureComponents, SignatureUtils
from voltaire.errors import InvalidLengthError


# secp256k1 curve order
SECP256K1_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
HALF_N = SECP256K1_N // 2


class TestSignatureNormalize:
    """Tests for SignatureUtils.normalize()"""

    def test_normalize_low_s_unchanged(self):
        """Low-s signatures should not be modified."""
        r = bytes.fromhex(
            "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
        )
        # s is in low half (s < N/2)
        s = bytes.fromhex(
            "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8"
        )

        r_norm, s_norm, was_normalized = SignatureUtils.normalize(r, s)

        assert was_normalized is False
        assert r_norm == r
        assert s_norm == s

    def test_normalize_high_s(self):
        """High-s signatures should be normalized to low-s."""
        r = bytes.fromhex(
            "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
        )
        # s is in high half (s > N/2)
        # Using N - 1 as high-s value
        high_s = SECP256K1_N - 1
        s = high_s.to_bytes(32, "big")

        r_norm, s_norm, was_normalized = SignatureUtils.normalize(r, s)

        assert was_normalized is True
        assert r_norm == r  # r unchanged

        # Normalized s should be N - high_s = 1
        expected_s = (SECP256K1_N - high_s).to_bytes(32, "big")
        assert s_norm == expected_s

    def test_normalize_boundary_value(self):
        """Test normalization at the boundary (s = N/2 + 1)."""
        r = bytes(32)
        r = (0x1234).to_bytes(32, "big")

        # s exactly at N/2 + 1 should be normalized
        s = (HALF_N + 1).to_bytes(32, "big")

        r_norm, s_norm, was_normalized = SignatureUtils.normalize(r, s)

        assert was_normalized is True
        expected_s = (SECP256K1_N - (HALF_N + 1)).to_bytes(32, "big")
        assert s_norm == expected_s

    def test_normalize_at_half_n(self):
        """s exactly at N/2 should NOT be normalized (it's in low range)."""
        r = (0x1234).to_bytes(32, "big")
        s = HALF_N.to_bytes(32, "big")

        r_norm, s_norm, was_normalized = SignatureUtils.normalize(r, s)

        assert was_normalized is False
        assert s_norm == s


class TestSignatureIsCanonical:
    """Tests for SignatureUtils.is_canonical()"""

    def test_valid_canonical_signature(self):
        """Valid low-s signature should be canonical."""
        r = bytes.fromhex(
            "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
        )
        s = bytes.fromhex(
            "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8"
        )

        assert SignatureUtils.is_canonical(r, s) is True

    def test_high_s_not_canonical(self):
        """High-s signature should not be canonical."""
        r = (0x1234).to_bytes(32, "big")
        # s > N/2
        high_s = SECP256K1_N - 1
        s = high_s.to_bytes(32, "big")

        assert SignatureUtils.is_canonical(r, s) is False

    def test_zero_r_not_canonical(self):
        """r = 0 should not be canonical."""
        r = bytes(32)  # all zeros
        s = (0x1234).to_bytes(32, "big")

        assert SignatureUtils.is_canonical(r, s) is False

    def test_zero_s_not_canonical(self):
        """s = 0 should not be canonical."""
        r = (0x1234).to_bytes(32, "big")
        s = bytes(32)  # all zeros

        assert SignatureUtils.is_canonical(r, s) is False

    def test_r_equals_n_not_canonical(self):
        """r >= N should not be canonical."""
        r = SECP256K1_N.to_bytes(32, "big")
        s = (0x1234).to_bytes(32, "big")

        assert SignatureUtils.is_canonical(r, s) is False

    def test_s_equals_n_not_canonical(self):
        """s >= N should not be canonical."""
        r = (0x1234).to_bytes(32, "big")
        s = SECP256K1_N.to_bytes(32, "big")

        assert SignatureUtils.is_canonical(r, s) is False


class TestSignatureParse:
    """Tests for SignatureUtils.parse()"""

    def test_parse_64_bytes(self):
        """Parse 64-byte compact signature (r + s)."""
        r_hex = "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
        s_hex = "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8"
        sig = bytes.fromhex(r_hex + s_hex)

        components = SignatureUtils.parse(sig)

        assert components.r == bytes.fromhex(r_hex)
        assert components.s == bytes.fromhex(s_hex)
        assert components.v == 0

    def test_parse_65_bytes(self):
        """Parse 65-byte signature with recovery id (r + s + v)."""
        r_hex = "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
        s_hex = "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8"
        v = 27
        sig = bytes.fromhex(r_hex + s_hex) + bytes([v])

        components = SignatureUtils.parse(sig)

        assert components.r == bytes.fromhex(r_hex)
        assert components.s == bytes.fromhex(s_hex)
        assert components.v == 27

    def test_parse_65_bytes_v_28(self):
        """Parse 65-byte signature with v=28."""
        r_hex = "1234567890123456789012345678901234567890123456789012345678901234"
        s_hex = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678ab"
        v = 28
        sig = bytes.fromhex(r_hex + s_hex) + bytes([v])

        components = SignatureUtils.parse(sig)

        assert components.v == 28

    def test_parse_65_bytes_v_0(self):
        """Parse 65-byte signature with v=0 (raw recovery id)."""
        r = bytes(32)
        s = bytes(32)
        v = 0
        sig = r + s + bytes([v])

        components = SignatureUtils.parse(sig)

        assert components.v == 0

    def test_parse_65_bytes_v_1(self):
        """Parse 65-byte signature with v=1 (raw recovery id)."""
        r = bytes(32)
        s = bytes(32)
        v = 1
        sig = r + s + bytes([v])

        components = SignatureUtils.parse(sig)

        assert components.v == 1

    def test_parse_invalid_length_63(self):
        """Should raise error for 63-byte signature."""
        sig = bytes(63)

        with pytest.raises(InvalidLengthError):
            SignatureUtils.parse(sig)

    def test_parse_invalid_length_66(self):
        """Should raise error for 66-byte signature."""
        sig = bytes(66)

        with pytest.raises(InvalidLengthError):
            SignatureUtils.parse(sig)

    def test_parse_invalid_length_32(self):
        """Should raise error for 32-byte input."""
        sig = bytes(32)

        with pytest.raises(InvalidLengthError):
            SignatureUtils.parse(sig)

    def test_parse_empty(self):
        """Should raise error for empty input."""
        sig = bytes(0)

        with pytest.raises(InvalidLengthError):
            SignatureUtils.parse(sig)


class TestSignatureSerialize:
    """Tests for SignatureUtils.serialize()"""

    def test_serialize_64_bytes(self):
        """Serialize to 64-byte compact format (no v)."""
        r = bytes.fromhex(
            "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
        )
        s = bytes.fromhex(
            "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8"
        )

        sig = SignatureUtils.serialize(r, s)

        assert len(sig) == 64
        assert sig[:32] == r
        assert sig[32:64] == s

    def test_serialize_65_bytes_with_v(self):
        """Serialize to 65-byte format with v."""
        r = bytes.fromhex(
            "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
        )
        s = bytes.fromhex(
            "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8"
        )
        v = 27

        sig = SignatureUtils.serialize(r, s, v=v)

        assert len(sig) == 65
        assert sig[:32] == r
        assert sig[32:64] == s
        assert sig[64] == 27

    def test_serialize_v_28(self):
        """Serialize with v=28."""
        r = bytes(32)
        s = bytes(32)

        sig = SignatureUtils.serialize(r, s, v=28)

        assert len(sig) == 65
        assert sig[64] == 28

    def test_serialize_v_0(self):
        """Serialize with v=0."""
        r = bytes(32)
        s = bytes(32)

        sig = SignatureUtils.serialize(r, s, v=0)

        assert len(sig) == 65
        assert sig[64] == 0

    def test_serialize_v_1(self):
        """Serialize with v=1."""
        r = bytes(32)
        s = bytes(32)

        sig = SignatureUtils.serialize(r, s, v=1)

        assert len(sig) == 65
        assert sig[64] == 1

    def test_serialize_invalid_r_length(self):
        """Should raise error for invalid r length."""
        r = bytes(31)  # too short
        s = bytes(32)

        with pytest.raises(InvalidLengthError):
            SignatureUtils.serialize(r, s)

    def test_serialize_invalid_s_length(self):
        """Should raise error for invalid s length."""
        r = bytes(32)
        s = bytes(33)  # too long

        with pytest.raises(InvalidLengthError):
            SignatureUtils.serialize(r, s)


class TestSignatureRoundTrip:
    """Round-trip tests for parse/serialize."""

    def test_roundtrip_64_bytes(self):
        """64-byte signature should round-trip correctly."""
        r = bytes.fromhex(
            "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
        )
        s = bytes.fromhex(
            "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8"
        )
        original = r + s

        components = SignatureUtils.parse(original)
        serialized = SignatureUtils.serialize(components.r, components.s)

        assert serialized == original

    def test_roundtrip_65_bytes(self):
        """65-byte signature should round-trip correctly."""
        r = bytes.fromhex(
            "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
        )
        s = bytes.fromhex(
            "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8"
        )
        v = 27
        original = r + s + bytes([v])

        components = SignatureUtils.parse(original)
        serialized = SignatureUtils.serialize(
            components.r, components.s, v=components.v
        )

        assert serialized == original

    def test_normalize_then_serialize(self):
        """Normalized signature should remain canonical after serialize."""
        r = (0x1234).to_bytes(32, "big")
        high_s = SECP256K1_N - 100
        s = high_s.to_bytes(32, "big")

        # Normalize
        r_norm, s_norm, _ = SignatureUtils.normalize(r, s)

        # Serialize and parse back
        sig = SignatureUtils.serialize(r_norm, s_norm, v=27)
        components = SignatureUtils.parse(sig)

        # Should still be canonical
        assert SignatureUtils.is_canonical(components.r, components.s)


class TestSignatureComponents:
    """Tests for SignatureComponents dataclass."""

    def test_components_immutable_fields(self):
        """SignatureComponents should store correct values."""
        r = bytes(32)
        s = bytes(32)
        v = 27

        components = SignatureComponents(r=r, s=s, v=v)

        assert components.r == r
        assert components.s == s
        assert components.v == v

    def test_components_equality(self):
        """SignatureComponents should support equality comparison."""
        r = bytes.fromhex(
            "1234567890123456789012345678901234567890123456789012345678901234"
        )
        s = bytes.fromhex(
            "abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678"
        )

        comp1 = SignatureComponents(r=r, s=s, v=27)
        comp2 = SignatureComponents(r=r, s=s, v=27)
        comp3 = SignatureComponents(r=r, s=s, v=28)

        assert comp1 == comp2
        assert comp1 != comp3
