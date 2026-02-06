"""
Tests for Blob module - EIP-4844 blob handling.
"""

import pytest
from voltaire.blob import (
    Blob,
    BLOB_SIZE,
    FIELD_ELEMENTS_PER_BLOB,
    BYTES_PER_FIELD_ELEMENT,
    MAX_DATA_PER_BLOB,
    GAS_PER_BLOB,
    TARGET_BLOBS_PER_BLOCK,
)
from voltaire.errors import InvalidLengthError, InvalidInputError


class TestBlobConstants:
    """Test blob constants."""

    def test_blob_size(self):
        assert BLOB_SIZE == 131072
        assert BLOB_SIZE == FIELD_ELEMENTS_PER_BLOB * BYTES_PER_FIELD_ELEMENT

    def test_field_elements_per_blob(self):
        assert FIELD_ELEMENTS_PER_BLOB == 4096

    def test_bytes_per_field_element(self):
        assert BYTES_PER_FIELD_ELEMENT == 32

    def test_max_data_per_blob(self):
        assert MAX_DATA_PER_BLOB == FIELD_ELEMENTS_PER_BLOB * (BYTES_PER_FIELD_ELEMENT - 1) - 4
        assert MAX_DATA_PER_BLOB == 126972

    def test_gas_per_blob(self):
        assert GAS_PER_BLOB == 131072
        assert GAS_PER_BLOB == 2**17

    def test_target_blobs_per_block(self):
        assert TARGET_BLOBS_PER_BLOCK == 3


class TestBlobConstructor:
    """Test Blob constructor."""

    def test_create_from_raw_bytes(self):
        raw = bytes(BLOB_SIZE)
        blob = Blob(raw)
        assert len(blob) == BLOB_SIZE

    def test_rejects_wrong_size(self):
        with pytest.raises(InvalidLengthError):
            Blob(bytes(100))

    def test_rejects_oversized(self):
        with pytest.raises(InvalidLengthError):
            Blob(bytes(BLOB_SIZE + 1))

    def test_rejects_undersized(self):
        with pytest.raises(InvalidLengthError):
            Blob(bytes(BLOB_SIZE - 1))


class TestBlobFromData:
    """Test Blob.from_data()."""

    def test_create_from_small_data(self):
        data = b"Hello, blob!"
        blob = Blob.from_data(data)
        assert len(blob) == BLOB_SIZE
        assert blob.is_valid()

    def test_create_from_empty_data(self):
        blob = Blob.from_data(b"")
        assert len(blob) == BLOB_SIZE
        assert blob.is_valid()

    def test_create_from_max_data(self):
        data = bytes(MAX_DATA_PER_BLOB)
        blob = Blob.from_data(data)
        assert len(blob) == BLOB_SIZE

    def test_rejects_oversized_data(self):
        oversized = bytes(MAX_DATA_PER_BLOB + 1)
        with pytest.raises(InvalidLengthError) as exc_info:
            Blob.from_data(oversized)
        assert "too large" in str(exc_info.value).lower()

    def test_roundtrip_small_data(self):
        original = b"Hello"
        blob = Blob.from_data(original)
        extracted = blob.to_data()
        assert extracted == original

    def test_roundtrip_empty_data(self):
        blob = Blob.from_data(b"")
        extracted = blob.to_data()
        assert extracted == b""

    def test_roundtrip_unicode(self):
        text = "Hello world!"
        original = text.encode("utf-8")
        blob = Blob.from_data(original)
        extracted = blob.to_data()
        assert extracted.decode("utf-8") == text

    def test_roundtrip_binary_data(self):
        original = bytes([i % 256 for i in range(10000)])
        blob = Blob.from_data(original)
        extracted = blob.to_data()
        assert extracted == original

    def test_roundtrip_max_data(self):
        original = bytes([i % 256 for i in range(MAX_DATA_PER_BLOB)])
        blob = Blob.from_data(original)
        extracted = blob.to_data()
        assert extracted == original


class TestBlobToData:
    """Test blob.to_data()."""

    def test_extracts_data(self):
        original = b"Test data"
        blob = Blob.from_data(original)
        assert blob.to_data() == original

    def test_handles_empty(self):
        blob = Blob.from_data(b"")
        assert blob.to_data() == b""

    def test_all_zeros_blob(self):
        # All-zero blob has length prefix of 0
        blob = Blob(bytes(BLOB_SIZE))
        data = blob.to_data()
        assert data == b""


class TestBlobIsValid:
    """Test blob.is_valid()."""

    def test_valid_blob(self):
        blob = Blob.from_data(b"test")
        assert blob.is_valid()

    def test_raw_blob_is_valid(self):
        blob = Blob(bytes(BLOB_SIZE))
        assert blob.is_valid()


class TestBlobToBytes:
    """Test blob.to_bytes()."""

    def test_returns_correct_size(self):
        blob = Blob.from_data(b"Hello")
        raw = blob.to_bytes()
        assert len(raw) == BLOB_SIZE

    def test_bytes_protocol(self):
        blob = Blob.from_data(b"Hello")
        raw = bytes(blob)
        assert len(raw) == BLOB_SIZE
        assert raw == blob.to_bytes()


class TestBlobCalculateGas:
    """Test Blob.calculate_gas()."""

    def test_single_blob(self):
        assert Blob.calculate_gas(1) == GAS_PER_BLOB

    def test_three_blobs(self):
        # Target per block
        assert Blob.calculate_gas(3) == GAS_PER_BLOB * 3

    def test_six_blobs(self):
        # Max per transaction
        assert Blob.calculate_gas(6) == GAS_PER_BLOB * 6

    def test_zero_blobs(self):
        assert Blob.calculate_gas(0) == 0


class TestBlobEstimateCount:
    """Test Blob.estimate_count()."""

    # Note: C API uses BLOB_SIZE - 8 (131064) as max data per blob,
    # not the field element encoding limit (126972)
    C_API_MAX_DATA = BLOB_SIZE - 8  # 131064

    def test_small_data(self):
        assert Blob.estimate_count(100) == 1
        assert Blob.estimate_count(1000) == 1

    def test_max_single_blob(self):
        # C API uses simpler encoding: BLOB_SIZE - 8 bytes per blob
        assert Blob.estimate_count(self.C_API_MAX_DATA) == 1

    def test_over_one_blob(self):
        assert Blob.estimate_count(self.C_API_MAX_DATA + 1) == 2

    def test_two_full_blobs(self):
        assert Blob.estimate_count(self.C_API_MAX_DATA * 2) == 2

    def test_over_two_blobs(self):
        assert Blob.estimate_count(self.C_API_MAX_DATA * 2 + 1) == 3

    def test_zero_data(self):
        assert Blob.estimate_count(0) == 0


class TestBlobCalculateGasPrice:
    """Test Blob.calculate_gas_price()."""

    def test_zero_excess(self):
        # Minimum price is 1 wei
        price = Blob.calculate_gas_price(0)
        assert price == 1  # Minimum is exactly 1

    def test_increases_with_excess(self):
        # Price increases exponentially with excess
        # Need sufficient excess to see a difference
        price_low = Blob.calculate_gas_price(GAS_PER_BLOB)  # 1 blob worth
        price_high = Blob.calculate_gas_price(GAS_PER_BLOB * 100)  # 100 blobs
        assert price_high > price_low

    def test_target_excess(self):
        # At target (393216), price should be slightly above minimum
        price = Blob.calculate_gas_price(GAS_PER_BLOB * 3)
        assert price >= 1

    def test_monotonically_increasing(self):
        # Gas price should monotonically increase with excess
        price1 = Blob.calculate_gas_price(0)
        price2 = Blob.calculate_gas_price(GAS_PER_BLOB * 10)
        price3 = Blob.calculate_gas_price(GAS_PER_BLOB * 100)
        assert price2 >= price1  # May equal at very low excess
        assert price3 > price2  # Should definitely increase at high excess


class TestBlobCalculateExcessGas:
    """Test Blob.calculate_excess_gas()."""

    def test_below_target(self):
        # If parent used less than target, excess decreases
        # target = 3 * 131072 = 393216
        result = Blob.calculate_excess_gas(393216, 131072)  # used 1 blob
        # excess = max(0, 393216 + 131072 - 393216) = 131072
        assert result == 131072

    def test_zero_excess_zero_used(self):
        result = Blob.calculate_excess_gas(0, 0)
        assert result == 0

    def test_at_target(self):
        # If exactly at target, excess stays same
        result = Blob.calculate_excess_gas(0, 393216)  # target gas
        assert result == 0  # stays at 0 since target is subtracted


class TestBlobLen:
    """Test len(blob)."""

    def test_len(self):
        blob = Blob.from_data(b"test")
        assert len(blob) == BLOB_SIZE


class TestBlobRepr:
    """Test blob representation."""

    def test_repr(self):
        blob = Blob.from_data(b"Hello")
        r = repr(blob)
        assert "Blob" in r
        assert "131072" in r or "5" in r  # size or data length


class TestBlobEdgeCases:
    """Test edge cases."""

    def test_all_zeros_data(self):
        data = bytes(1000)
        blob = Blob.from_data(data)
        extracted = blob.to_data()
        assert extracted == data

    def test_all_ones_data(self):
        data = bytes([0xFF] * 1000)
        blob = Blob.from_data(data)
        extracted = blob.to_data()
        assert extracted == data

    def test_alternating_pattern(self):
        data = bytes([0xAA, 0x55] * 500)
        blob = Blob.from_data(data)
        extracted = blob.to_data()
        assert extracted == data

    def test_sequential_pattern(self):
        data = bytes([i % 256 for i in range(5000)])
        blob = Blob.from_data(data)
        extracted = blob.to_data()
        assert extracted == data


class TestBlobIntegration:
    """Integration tests."""

    def test_gas_estimation_workflow(self):
        data_size = 300000  # 300KB
        blob_count = Blob.estimate_count(data_size)
        gas = Blob.calculate_gas(blob_count)

        assert blob_count >= 3
        assert gas == blob_count * GAS_PER_BLOB

    def test_multiple_blobs_sequential(self):
        # Create multiple blobs sequentially
        datas = [f"Blob {i}".encode() for i in range(5)]
        blobs = [Blob.from_data(d) for d in datas]

        for i, blob in enumerate(blobs):
            assert blob.is_valid()
            assert blob.to_data() == datas[i]
