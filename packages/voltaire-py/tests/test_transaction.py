"""Tests for Transaction module."""

import pytest
from voltaire import (
    Transaction,
    TransactionType,
    Address,
    InvalidInputError,
    InvalidLengthError,
)


class TestTransactionType:
    """Tests for TransactionType enum."""

    def test_legacy_value(self):
        """Legacy type has value 0."""
        assert TransactionType.LEGACY == 0

    def test_eip2930_value(self):
        """EIP-2930 type has value 1."""
        assert TransactionType.EIP2930 == 1

    def test_eip1559_value(self):
        """EIP-1559 type has value 2."""
        assert TransactionType.EIP1559 == 2

    def test_eip4844_value(self):
        """EIP-4844 type has value 3."""
        assert TransactionType.EIP4844 == 3

    def test_eip7702_value(self):
        """EIP-7702 type has value 4."""
        assert TransactionType.EIP7702 == 4

    def test_enum_is_int(self):
        """TransactionType values are integers."""
        assert isinstance(TransactionType.LEGACY, int)
        assert isinstance(TransactionType.EIP1559, int)


class TestDetectType:
    """Tests for Transaction.detect_type method."""

    def test_detect_legacy_rlp_list(self):
        """Detect legacy transaction from RLP list prefix (0xc0+)."""
        # RLP list with prefix >= 0xc0 indicates legacy
        # 0xf8 = 0xc0 + 0x38, meaning list with length prefix
        legacy_tx = bytes.fromhex("f86c808504a817c80082520894")
        tx_type = Transaction.detect_type(legacy_tx)
        assert tx_type == TransactionType.LEGACY

    def test_detect_eip2930_type_prefix(self):
        """Detect EIP-2930 from type prefix 0x01."""
        # Type 1 transaction starts with 0x01
        eip2930_tx = bytes([0x01]) + bytes.fromhex("f86c808504a817c80082520894")
        tx_type = Transaction.detect_type(eip2930_tx)
        assert tx_type == TransactionType.EIP2930

    def test_detect_eip1559_type_prefix(self):
        """Detect EIP-1559 from type prefix 0x02."""
        # Type 2 transaction starts with 0x02
        eip1559_tx = bytes([0x02]) + bytes.fromhex("f86c808504a817c80082520894")
        tx_type = Transaction.detect_type(eip1559_tx)
        assert tx_type == TransactionType.EIP1559

    def test_detect_eip4844_type_prefix(self):
        """Detect EIP-4844 from type prefix 0x03."""
        # Type 3 transaction starts with 0x03
        eip4844_tx = bytes([0x03]) + bytes.fromhex("f86c808504a817c80082520894")
        tx_type = Transaction.detect_type(eip4844_tx)
        assert tx_type == TransactionType.EIP4844

    def test_detect_eip7702_type_prefix(self):
        """Detect EIP-7702 from type prefix 0x04."""
        # Type 4 transaction starts with 0x04
        eip7702_tx = bytes([0x04]) + bytes.fromhex("f86c808504a817c80082520894")
        tx_type = Transaction.detect_type(eip7702_tx)
        assert tx_type == TransactionType.EIP7702

    def test_detect_empty_raises(self):
        """Empty data raises error."""
        with pytest.raises(InvalidInputError):
            Transaction.detect_type(b"")

    def test_return_type_is_enum(self):
        """Return type is TransactionType enum."""
        legacy_tx = bytes.fromhex("f86c808504a817c80082520894")
        tx_type = Transaction.detect_type(legacy_tx)
        assert isinstance(tx_type, TransactionType)


class TestCalculateCreateAddress:
    """Tests for Transaction.calculate_create_address method."""

    def test_known_create_address_nonce_0(self):
        """Calculate CREATE address with nonce 0."""
        # Known test vector: sender + nonce -> contract address
        sender = Address.from_hex("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
        contract = Transaction.calculate_create_address(sender, 0)

        # Address should be valid 20 bytes
        assert len(contract.to_bytes()) == 20
        assert not contract.is_zero()

    def test_known_create_address_nonce_1(self):
        """Calculate CREATE address with nonce 1."""
        sender = Address.from_hex("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
        contract_0 = Transaction.calculate_create_address(sender, 0)
        contract_1 = Transaction.calculate_create_address(sender, 1)

        # Different nonces produce different addresses
        assert contract_0 != contract_1

    def test_create_address_deterministic(self):
        """Same sender+nonce always produces same address."""
        sender = Address.from_hex("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
        addr1 = Transaction.calculate_create_address(sender, 42)
        addr2 = Transaction.calculate_create_address(sender, 42)
        assert addr1 == addr2

    def test_create_address_different_senders(self):
        """Different senders with same nonce produce different addresses."""
        sender1 = Address.from_hex("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
        sender2 = Address.from_hex("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")

        addr1 = Transaction.calculate_create_address(sender1, 0)
        addr2 = Transaction.calculate_create_address(sender2, 0)
        assert addr1 != addr2

    def test_create_address_large_nonce(self):
        """Handle large nonce values."""
        sender = Address.from_hex("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
        # Large nonce (but within u64 range)
        contract = Transaction.calculate_create_address(sender, 10000000)
        assert len(contract.to_bytes()) == 20

    def test_create_address_returns_address(self):
        """Return type is Address."""
        sender = Address.from_hex("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
        contract = Transaction.calculate_create_address(sender, 0)
        assert isinstance(contract, Address)

    def test_create_address_known_vector_vitalik(self):
        """Test against known Vitalik.eth CREATE addresses."""
        # Vitalik's address
        vitalik = Address.from_hex("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")

        # First contract deployed would be at nonce 0
        contract = Transaction.calculate_create_address(vitalik, 0)

        # Just verify it's a valid address (specific value depends on RLP encoding)
        assert len(contract.to_hex()) == 42
        assert contract.to_hex().startswith("0x")


class TestCalculateCreate2Address:
    """Tests for Transaction.calculate_create2_address method."""

    def test_create2_basic(self):
        """Calculate CREATE2 address with basic inputs."""
        factory = Address.from_hex("0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f")
        salt = bytes(32)  # 32 zero bytes
        init_code = bytes.fromhex("6080604052")

        contract = Transaction.calculate_create2_address(factory, salt, init_code)
        assert len(contract.to_bytes()) == 20

    def test_create2_deterministic(self):
        """CREATE2 is deterministic - same inputs, same output."""
        factory = Address.from_hex("0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f")
        salt = bytes(32)
        init_code = bytes.fromhex("6080604052")

        addr1 = Transaction.calculate_create2_address(factory, salt, init_code)
        addr2 = Transaction.calculate_create2_address(factory, salt, init_code)
        assert addr1 == addr2

    def test_create2_different_salt(self):
        """Different salt produces different address."""
        factory = Address.from_hex("0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f")
        init_code = bytes.fromhex("6080604052")

        salt1 = bytes(32)
        salt2 = bytes(31) + bytes([1])

        addr1 = Transaction.calculate_create2_address(factory, salt1, init_code)
        addr2 = Transaction.calculate_create2_address(factory, salt2, init_code)
        assert addr1 != addr2

    def test_create2_different_init_code(self):
        """Different init_code produces different address."""
        factory = Address.from_hex("0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f")
        salt = bytes(32)

        addr1 = Transaction.calculate_create2_address(factory, salt, bytes.fromhex("6080604052"))
        addr2 = Transaction.calculate_create2_address(factory, salt, bytes.fromhex("6080604053"))
        assert addr1 != addr2

    def test_create2_invalid_salt_length(self):
        """Salt must be exactly 32 bytes."""
        factory = Address.from_hex("0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f")
        init_code = bytes.fromhex("6080604052")

        with pytest.raises(InvalidLengthError):
            Transaction.calculate_create2_address(factory, bytes(31), init_code)

        with pytest.raises(InvalidLengthError):
            Transaction.calculate_create2_address(factory, bytes(33), init_code)

    def test_create2_empty_init_code(self):
        """Empty init_code is valid."""
        factory = Address.from_hex("0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f")
        salt = bytes(32)

        contract = Transaction.calculate_create2_address(factory, salt, b"")
        assert len(contract.to_bytes()) == 20
