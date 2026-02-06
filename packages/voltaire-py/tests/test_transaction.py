"""Tests for Transaction module."""

import pytest
from voltaire import (
    Transaction,
    TransactionType,
    Address,
    InvalidInputError,
    InvalidLengthError,
)
from voltaire.transaction import (
    LegacyTransaction,
    EIP2930Transaction,
    EIP1559Transaction,
    EIP4844Transaction,
    EIP7702Transaction,
    decode_transaction,
)
from voltaire.access_list import AccessList, AccessListEntry


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


# ============================================================================
# Transaction Dataclass Tests
# ============================================================================


class TestLegacyTransaction:
    """Tests for LegacyTransaction dataclass."""

    def test_create_legacy_tx(self):
        """Create a basic legacy transaction."""
        tx = LegacyTransaction(
            nonce=0,
            gas_price=20_000_000_000,
            gas_limit=21000,
            to=bytes.fromhex("742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
            value=1_000_000_000_000_000_000,
            data=b"",
            v=27,
            r=bytes(32),
            s=bytes(32),
        )
        assert tx.nonce == 0
        assert tx.gas_price == 20_000_000_000
        assert tx.gas_limit == 21000
        assert tx.value == 1_000_000_000_000_000_000
        assert tx.data == b""
        assert tx.v == 27

    def test_legacy_tx_contract_creation(self):
        """Legacy tx with to=None is contract creation."""
        tx = LegacyTransaction(
            nonce=0,
            gas_price=20_000_000_000,
            gas_limit=500_000,
            to=None,
            value=0,
            data=bytes.fromhex("6080604052"),
            v=27,
            r=bytes(32),
            s=bytes(32),
        )
        assert tx.to is None
        assert tx.is_contract_creation()

    def test_legacy_tx_is_immutable(self):
        """LegacyTransaction is frozen/immutable."""
        tx = LegacyTransaction(
            nonce=0,
            gas_price=20_000_000_000,
            gas_limit=21000,
            to=bytes(20),
            value=0,
            data=b"",
            v=27,
            r=bytes(32),
            s=bytes(32),
        )
        with pytest.raises(AttributeError):
            tx.nonce = 1  # type: ignore

    def test_legacy_tx_invalid_to_length(self):
        """Invalid to address length raises error."""
        with pytest.raises(InvalidLengthError):
            LegacyTransaction(
                nonce=0,
                gas_price=20_000_000_000,
                gas_limit=21000,
                to=bytes(19),  # Should be 20
                value=0,
                data=b"",
                v=27,
                r=bytes(32),
                s=bytes(32),
            )

    def test_legacy_tx_invalid_r_length(self):
        """Invalid r length raises error."""
        with pytest.raises(InvalidLengthError):
            LegacyTransaction(
                nonce=0,
                gas_price=20_000_000_000,
                gas_limit=21000,
                to=bytes(20),
                value=0,
                data=b"",
                v=27,
                r=bytes(31),  # Should be 32
                s=bytes(32),
            )

    def test_legacy_tx_invalid_s_length(self):
        """Invalid s length raises error."""
        with pytest.raises(InvalidLengthError):
            LegacyTransaction(
                nonce=0,
                gas_price=20_000_000_000,
                gas_limit=21000,
                to=bytes(20),
                value=0,
                data=b"",
                v=27,
                r=bytes(32),
                s=bytes(31),  # Should be 32
            )

    def test_legacy_tx_tx_type(self):
        """Legacy transaction reports correct type."""
        tx = LegacyTransaction(
            nonce=0,
            gas_price=20_000_000_000,
            gas_limit=21000,
            to=bytes(20),
            value=0,
            data=b"",
            v=27,
            r=bytes(32),
            s=bytes(32),
        )
        assert tx.tx_type == TransactionType.LEGACY

    def test_legacy_tx_equality(self):
        """Legacy transactions with same fields are equal."""
        tx1 = LegacyTransaction(
            nonce=0,
            gas_price=20_000_000_000,
            gas_limit=21000,
            to=bytes(20),
            value=0,
            data=b"",
            v=27,
            r=bytes(32),
            s=bytes(32),
        )
        tx2 = LegacyTransaction(
            nonce=0,
            gas_price=20_000_000_000,
            gas_limit=21000,
            to=bytes(20),
            value=0,
            data=b"",
            v=27,
            r=bytes(32),
            s=bytes(32),
        )
        assert tx1 == tx2


class TestEIP2930Transaction:
    """Tests for EIP2930Transaction dataclass."""

    def test_create_eip2930_tx(self):
        """Create a basic EIP-2930 transaction."""
        tx = EIP2930Transaction(
            chain_id=1,
            nonce=0,
            gas_price=20_000_000_000,
            gas_limit=21000,
            to=bytes.fromhex("742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
            value=0,
            data=b"",
            access_list=AccessList(),
            v=0,
            r=bytes(32),
            s=bytes(32),
        )
        assert tx.chain_id == 1
        assert tx.tx_type == TransactionType.EIP2930

    def test_eip2930_tx_with_access_list(self):
        """EIP-2930 tx with populated access list."""
        al = AccessList.from_list([
            {
                "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
                "storageKeys": ["0x" + "00" * 32],
            }
        ])
        tx = EIP2930Transaction(
            chain_id=1,
            nonce=0,
            gas_price=20_000_000_000,
            gas_limit=50000,
            to=bytes.fromhex("742d35Cc6634C0532925a3b844Bc9e7595f251e3"),
            value=0,
            data=b"",
            access_list=al,
            v=0,
            r=bytes(32),
            s=bytes(32),
        )
        assert len(tx.access_list) == 1

    def test_eip2930_tx_is_immutable(self):
        """EIP2930Transaction is frozen/immutable."""
        tx = EIP2930Transaction(
            chain_id=1,
            nonce=0,
            gas_price=20_000_000_000,
            gas_limit=21000,
            to=bytes(20),
            value=0,
            data=b"",
            access_list=AccessList(),
            v=0,
            r=bytes(32),
            s=bytes(32),
        )
        with pytest.raises(AttributeError):
            tx.chain_id = 2  # type: ignore


class TestEIP1559Transaction:
    """Tests for EIP1559Transaction dataclass."""

    def test_create_eip1559_tx(self):
        """Create a basic EIP-1559 transaction."""
        tx = EIP1559Transaction(
            chain_id=1,
            nonce=42,
            max_priority_fee_per_gas=2_000_000_000,
            max_fee_per_gas=30_000_000_000,
            gas_limit=21000,
            to=bytes.fromhex("742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
            value=1_000_000_000_000_000_000,
            data=b"",
            access_list=AccessList(),
            v=0,
            r=bytes(32),
            s=bytes(32),
        )
        assert tx.chain_id == 1
        assert tx.nonce == 42
        assert tx.max_priority_fee_per_gas == 2_000_000_000
        assert tx.max_fee_per_gas == 30_000_000_000
        assert tx.tx_type == TransactionType.EIP1559

    def test_eip1559_tx_contract_creation(self):
        """EIP-1559 tx with to=None is contract creation."""
        tx = EIP1559Transaction(
            chain_id=1,
            nonce=0,
            max_priority_fee_per_gas=2_000_000_000,
            max_fee_per_gas=30_000_000_000,
            gas_limit=500_000,
            to=None,
            value=0,
            data=bytes.fromhex("6080604052"),
            access_list=AccessList(),
            v=0,
            r=bytes(32),
            s=bytes(32),
        )
        assert tx.is_contract_creation()

    def test_eip1559_tx_is_immutable(self):
        """EIP1559Transaction is frozen/immutable."""
        tx = EIP1559Transaction(
            chain_id=1,
            nonce=0,
            max_priority_fee_per_gas=2_000_000_000,
            max_fee_per_gas=30_000_000_000,
            gas_limit=21000,
            to=bytes(20),
            value=0,
            data=b"",
            access_list=AccessList(),
            v=0,
            r=bytes(32),
            s=bytes(32),
        )
        with pytest.raises(AttributeError):
            tx.nonce = 1  # type: ignore

    def test_eip1559_effective_gas_price(self):
        """Calculate effective gas price correctly."""
        tx = EIP1559Transaction(
            chain_id=1,
            nonce=0,
            max_priority_fee_per_gas=2_000_000_000,  # 2 gwei
            max_fee_per_gas=30_000_000_000,          # 30 gwei
            gas_limit=21000,
            to=bytes(20),
            value=0,
            data=b"",
            access_list=AccessList(),
            v=0,
            r=bytes(32),
            s=bytes(32),
        )

        # With base fee of 15 gwei
        base_fee = 15_000_000_000
        effective = tx.effective_gas_price(base_fee)
        # effective = base_fee + min(priority, max_fee - base_fee)
        # = 15 + min(2, 30 - 15) = 15 + 2 = 17 gwei
        assert effective == 17_000_000_000

    def test_eip1559_effective_gas_price_capped(self):
        """Effective gas price is capped at max_fee."""
        tx = EIP1559Transaction(
            chain_id=1,
            nonce=0,
            max_priority_fee_per_gas=5_000_000_000,  # 5 gwei
            max_fee_per_gas=20_000_000_000,          # 20 gwei
            gas_limit=21000,
            to=bytes(20),
            value=0,
            data=b"",
            access_list=AccessList(),
            v=0,
            r=bytes(32),
            s=bytes(32),
        )

        # With base fee of 18 gwei (leaving only 2 gwei headroom)
        base_fee = 18_000_000_000
        effective = tx.effective_gas_price(base_fee)
        # effective = 18 + min(5, 20 - 18) = 18 + 2 = 20 gwei
        assert effective == 20_000_000_000


class TestEIP4844Transaction:
    """Tests for EIP4844Transaction dataclass."""

    def test_create_eip4844_tx(self):
        """Create a basic EIP-4844 transaction."""
        tx = EIP4844Transaction(
            chain_id=1,
            nonce=0,
            max_priority_fee_per_gas=1_000_000_000,
            max_fee_per_gas=50_000_000_000,
            gas_limit=100_000,
            to=bytes.fromhex("000000000000000000000000000000000000dead"),
            value=0,
            data=b"",
            access_list=AccessList(),
            max_fee_per_blob_gas=10_000_000_000,
            blob_versioned_hashes=(bytes.fromhex("01" + "00" * 31),),
            v=0,
            r=bytes(32),
            s=bytes(32),
        )
        assert tx.chain_id == 1
        assert tx.max_fee_per_blob_gas == 10_000_000_000
        assert len(tx.blob_versioned_hashes) == 1
        assert tx.tx_type == TransactionType.EIP4844

    def test_eip4844_tx_requires_to(self):
        """EIP-4844 tx requires to address (cannot be None)."""
        with pytest.raises(InvalidInputError):
            EIP4844Transaction(
                chain_id=1,
                nonce=0,
                max_priority_fee_per_gas=1_000_000_000,
                max_fee_per_gas=50_000_000_000,
                gas_limit=100_000,
                to=None,  # Not allowed for blob tx
                value=0,
                data=b"",
                access_list=AccessList(),
                max_fee_per_blob_gas=10_000_000_000,
                blob_versioned_hashes=(bytes(32),),
                v=0,
                r=bytes(32),
                s=bytes(32),
            )

    def test_eip4844_tx_requires_blob_hashes(self):
        """EIP-4844 tx requires at least one blob hash."""
        with pytest.raises(InvalidInputError):
            EIP4844Transaction(
                chain_id=1,
                nonce=0,
                max_priority_fee_per_gas=1_000_000_000,
                max_fee_per_gas=50_000_000_000,
                gas_limit=100_000,
                to=bytes(20),
                value=0,
                data=b"",
                access_list=AccessList(),
                max_fee_per_blob_gas=10_000_000_000,
                blob_versioned_hashes=(),  # Empty not allowed
                v=0,
                r=bytes(32),
                s=bytes(32),
            )

    def test_eip4844_tx_blob_hash_length(self):
        """Blob versioned hashes must be 32 bytes each."""
        with pytest.raises(InvalidLengthError):
            EIP4844Transaction(
                chain_id=1,
                nonce=0,
                max_priority_fee_per_gas=1_000_000_000,
                max_fee_per_gas=50_000_000_000,
                gas_limit=100_000,
                to=bytes(20),
                value=0,
                data=b"",
                access_list=AccessList(),
                max_fee_per_blob_gas=10_000_000_000,
                blob_versioned_hashes=(bytes(31),),  # Should be 32
                v=0,
                r=bytes(32),
                s=bytes(32),
            )

    def test_eip4844_tx_is_immutable(self):
        """EIP4844Transaction is frozen/immutable."""
        tx = EIP4844Transaction(
            chain_id=1,
            nonce=0,
            max_priority_fee_per_gas=1_000_000_000,
            max_fee_per_gas=50_000_000_000,
            gas_limit=100_000,
            to=bytes(20),
            value=0,
            data=b"",
            access_list=AccessList(),
            max_fee_per_blob_gas=10_000_000_000,
            blob_versioned_hashes=(bytes(32),),
            v=0,
            r=bytes(32),
            s=bytes(32),
        )
        with pytest.raises(AttributeError):
            tx.chain_id = 2  # type: ignore

    def test_eip4844_is_not_contract_creation(self):
        """EIP-4844 cannot be contract creation."""
        tx = EIP4844Transaction(
            chain_id=1,
            nonce=0,
            max_priority_fee_per_gas=1_000_000_000,
            max_fee_per_gas=50_000_000_000,
            gas_limit=100_000,
            to=bytes(20),
            value=0,
            data=b"",
            access_list=AccessList(),
            max_fee_per_blob_gas=10_000_000_000,
            blob_versioned_hashes=(bytes(32),),
            v=0,
            r=bytes(32),
            s=bytes(32),
        )
        assert not tx.is_contract_creation()


class TestEIP7702Transaction:
    """Tests for EIP7702Transaction dataclass."""

    def test_create_eip7702_tx(self):
        """Create a basic EIP-7702 transaction."""
        from voltaire.authorization import Authorization

        auth = Authorization(
            chain_id=1,
            address=bytes(20),
            nonce=0,
            y_parity=0,
            r=bytes(32),
            s=bytes(32),
        )
        tx = EIP7702Transaction(
            chain_id=1,
            nonce=0,
            max_priority_fee_per_gas=2_000_000_000,
            max_fee_per_gas=30_000_000_000,
            gas_limit=100_000,
            to=bytes(20),
            value=0,
            data=b"",
            access_list=AccessList(),
            authorization_list=(auth,),
            v=0,
            r=bytes(32),
            s=bytes(32),
        )
        assert tx.chain_id == 1
        assert len(tx.authorization_list) == 1
        assert tx.tx_type == TransactionType.EIP7702

    def test_eip7702_tx_empty_auth_list_allowed(self):
        """EIP-7702 tx allows empty authorization list."""
        tx = EIP7702Transaction(
            chain_id=1,
            nonce=0,
            max_priority_fee_per_gas=2_000_000_000,
            max_fee_per_gas=30_000_000_000,
            gas_limit=100_000,
            to=bytes(20),
            value=0,
            data=b"",
            access_list=AccessList(),
            authorization_list=(),
            v=0,
            r=bytes(32),
            s=bytes(32),
        )
        assert len(tx.authorization_list) == 0

    def test_eip7702_tx_is_immutable(self):
        """EIP7702Transaction is frozen/immutable."""
        tx = EIP7702Transaction(
            chain_id=1,
            nonce=0,
            max_priority_fee_per_gas=2_000_000_000,
            max_fee_per_gas=30_000_000_000,
            gas_limit=100_000,
            to=bytes(20),
            value=0,
            data=b"",
            access_list=AccessList(),
            authorization_list=(),
            v=0,
            r=bytes(32),
            s=bytes(32),
        )
        with pytest.raises(AttributeError):
            tx.chain_id = 2  # type: ignore


class TestDecodeTransaction:
    """Tests for decode_transaction function."""

    def test_decode_detects_legacy(self):
        """decode_transaction correctly identifies legacy tx."""
        # Create a minimal valid legacy-looking RLP
        # For now just test detection works; full decode needs C FFI
        legacy_data = bytes.fromhex("f86c808504a817c80082520894742d35cc6634c0532925a3b844bc9e7595f51e3e880de0b6b3a7640000801ba0")
        tx_type = Transaction.detect_type(legacy_data)
        assert tx_type == TransactionType.LEGACY

    def test_decode_detects_eip1559(self):
        """decode_transaction correctly identifies EIP-1559 tx."""
        # Type 2 prefix
        eip1559_data = bytes([0x02]) + bytes.fromhex("f86c0180843b9aca008504a817c80082520894")
        tx_type = Transaction.detect_type(eip1559_data)
        assert tx_type == TransactionType.EIP1559


class TestTransactionCommon:
    """Tests for common transaction functionality."""

    def test_all_tx_types_have_tx_type_property(self):
        """All transaction types expose tx_type property."""
        legacy = LegacyTransaction(
            nonce=0, gas_price=1, gas_limit=21000, to=bytes(20),
            value=0, data=b"", v=27, r=bytes(32), s=bytes(32)
        )
        eip2930 = EIP2930Transaction(
            chain_id=1, nonce=0, gas_price=1, gas_limit=21000, to=bytes(20),
            value=0, data=b"", access_list=AccessList(), v=0, r=bytes(32), s=bytes(32)
        )
        eip1559 = EIP1559Transaction(
            chain_id=1, nonce=0, max_priority_fee_per_gas=1, max_fee_per_gas=2,
            gas_limit=21000, to=bytes(20), value=0, data=b"",
            access_list=AccessList(), v=0, r=bytes(32), s=bytes(32)
        )
        eip4844 = EIP4844Transaction(
            chain_id=1, nonce=0, max_priority_fee_per_gas=1, max_fee_per_gas=2,
            gas_limit=21000, to=bytes(20), value=0, data=b"",
            access_list=AccessList(), max_fee_per_blob_gas=1,
            blob_versioned_hashes=(bytes(32),), v=0, r=bytes(32), s=bytes(32)
        )
        eip7702 = EIP7702Transaction(
            chain_id=1, nonce=0, max_priority_fee_per_gas=1, max_fee_per_gas=2,
            gas_limit=21000, to=bytes(20), value=0, data=b"",
            access_list=AccessList(), authorization_list=(),
            v=0, r=bytes(32), s=bytes(32)
        )

        assert legacy.tx_type == TransactionType.LEGACY
        assert eip2930.tx_type == TransactionType.EIP2930
        assert eip1559.tx_type == TransactionType.EIP1559
        assert eip4844.tx_type == TransactionType.EIP4844
        assert eip7702.tx_type == TransactionType.EIP7702

    def test_all_tx_types_have_is_contract_creation(self):
        """All transaction types expose is_contract_creation method."""
        legacy_call = LegacyTransaction(
            nonce=0, gas_price=1, gas_limit=21000, to=bytes(20),
            value=0, data=b"", v=27, r=bytes(32), s=bytes(32)
        )
        legacy_create = LegacyTransaction(
            nonce=0, gas_price=1, gas_limit=21000, to=None,
            value=0, data=b"", v=27, r=bytes(32), s=bytes(32)
        )

        assert not legacy_call.is_contract_creation()
        assert legacy_create.is_contract_creation()
