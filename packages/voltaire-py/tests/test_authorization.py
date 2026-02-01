"""Tests for Authorization module (EIP-7702)."""

import pytest
from voltaire.authorization import (
    Authorization,
    MAGIC_BYTE,
    PER_AUTH_BASE_COST,
    PER_EMPTY_ACCOUNT_COST,
    SECP256K1_N,
    SECP256K1_HALF_N,
)
from voltaire.errors import InvalidAuthorizationError


# ============================================================================
# Test Data Helpers
# ============================================================================


def create_address(byte: int) -> bytes:
    """Create a 20-byte address filled with a single byte value."""
    return bytes([byte] * 20)


def create_r_bytes(value: int) -> bytes:
    """Create 32-byte r value from integer."""
    return value.to_bytes(32, "big")


def create_s_bytes(value: int) -> bytes:
    """Create 32-byte s value from integer."""
    return value.to_bytes(32, "big")


ADDR1 = create_address(0x11)
ADDR2 = create_address(0x22)
ZERO_ADDRESS = create_address(0x00)

VALID_R = create_r_bytes(0x123456)
VALID_S = create_s_bytes(0x789ABC)


# ============================================================================
# Constants Tests
# ============================================================================


class TestConstants:
    """Tests for Authorization constants."""

    def test_magic_byte(self):
        """MAGIC_BYTE is 0x05."""
        assert MAGIC_BYTE == 0x05

    def test_per_auth_base_cost(self):
        """PER_AUTH_BASE_COST is 12500."""
        assert PER_AUTH_BASE_COST == 12500

    def test_per_empty_account_cost(self):
        """PER_EMPTY_ACCOUNT_COST is 25000."""
        assert PER_EMPTY_ACCOUNT_COST == 25000

    def test_secp256k1_n(self):
        """SECP256K1_N is correct curve order."""
        expected = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
        assert SECP256K1_N == expected

    def test_secp256k1_half_n(self):
        """SECP256K1_HALF_N is N/2."""
        assert SECP256K1_HALF_N == SECP256K1_N // 2


# ============================================================================
# Constructor Tests
# ============================================================================


class TestConstructor:
    """Tests for Authorization constructor."""

    def test_create_valid_authorization(self):
        """Create a valid authorization."""
        auth = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        assert auth.chain_id == 1
        assert auth.address == ADDR1
        assert auth.nonce == 0
        assert auth.y_parity == 0
        assert auth.r == VALID_R
        assert auth.s == VALID_S

    def test_authorization_is_immutable(self):
        """Authorization is frozen dataclass."""
        auth = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        with pytest.raises(AttributeError):
            auth.chain_id = 2


class TestFromDict:
    """Tests for Authorization.from_dict constructor."""

    def test_from_dict_valid(self):
        """Create from dict with valid data."""
        auth = Authorization.from_dict({
            "chainId": 1,
            "address": "0x" + ADDR1.hex(),
            "nonce": 0,
            "yParity": 0,
            "r": "0x" + VALID_R.hex(),
            "s": "0x" + VALID_S.hex(),
        })
        assert auth.chain_id == 1
        assert auth.address == ADDR1
        assert auth.nonce == 0

    def test_from_dict_without_0x_prefix(self):
        """Create from dict without 0x prefixes."""
        auth = Authorization.from_dict({
            "chainId": 1,
            "address": ADDR1.hex(),
            "nonce": 0,
            "yParity": 0,
            "r": VALID_R.hex(),
            "s": VALID_S.hex(),
        })
        assert auth.address == ADDR1

    def test_from_dict_bytes_values(self):
        """Create from dict with bytes values."""
        auth = Authorization.from_dict({
            "chainId": 1,
            "address": ADDR1,
            "nonce": 0,
            "yParity": 0,
            "r": VALID_R,
            "s": VALID_S,
        })
        assert auth.address == ADDR1


class TestToDict:
    """Tests for Authorization.to_dict method."""

    def test_to_dict(self):
        """Convert to dict."""
        auth = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=42,
            y_parity=1,
            r=VALID_R,
            s=VALID_S,
        )
        d = auth.to_dict()
        assert d["chainId"] == 1
        assert d["address"] == "0x" + ADDR1.hex()
        assert d["nonce"] == 42
        assert d["yParity"] == 1
        assert d["r"] == "0x" + VALID_R.hex()
        assert d["s"] == "0x" + VALID_S.hex()

    def test_to_dict_roundtrip(self):
        """to_dict/from_dict roundtrip preserves data."""
        auth1 = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        auth2 = Authorization.from_dict(auth1.to_dict())
        assert auth1 == auth2


# ============================================================================
# Validation Tests
# ============================================================================


class TestValidate:
    """Tests for Authorization.validate method."""

    def test_valid_authorization(self):
        """Valid authorization passes validation."""
        auth = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        assert auth.validate() is True

    def test_chain_id_zero_allowed(self):
        """Chain ID 0 is allowed for cross-chain authorization (EIP-7702)."""
        auth = Authorization(
            chain_id=0,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        assert auth.validate() is True

    def test_zero_address_rejected(self):
        """Zero address is rejected."""
        auth = Authorization(
            chain_id=1,
            address=ZERO_ADDRESS,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        with pytest.raises(InvalidAuthorizationError, match="zero address"):
            auth.validate()

    def test_y_parity_0_valid(self):
        """y_parity = 0 is valid."""
        auth = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        assert auth.validate() is True

    def test_y_parity_1_valid(self):
        """y_parity = 1 is valid."""
        auth = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=1,
            r=VALID_R,
            s=VALID_S,
        )
        assert auth.validate() is True

    def test_y_parity_2_rejected(self):
        """y_parity = 2 is rejected."""
        auth = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=2,
            r=VALID_R,
            s=VALID_S,
        )
        with pytest.raises(InvalidAuthorizationError, match="yParity must be 0 or 1"):
            auth.validate()

    def test_y_parity_negative_rejected(self):
        """y_parity = -1 is rejected."""
        auth = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=-1,
            r=VALID_R,
            s=VALID_S,
        )
        with pytest.raises(InvalidAuthorizationError, match="yParity must be 0 or 1"):
            auth.validate()

    def test_zero_r_rejected(self):
        """r = 0 is rejected."""
        auth = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=bytes(32),
            s=VALID_S,
        )
        with pytest.raises(InvalidAuthorizationError, match="r cannot be zero"):
            auth.validate()

    def test_zero_s_rejected(self):
        """s = 0 is rejected."""
        auth = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=bytes(32),
        )
        with pytest.raises(InvalidAuthorizationError, match="s cannot be zero"):
            auth.validate()

    def test_r_equals_n_rejected(self):
        """r = N is rejected."""
        r_bytes = SECP256K1_N.to_bytes(32, "big")
        auth = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=r_bytes,
            s=VALID_S,
        )
        with pytest.raises(InvalidAuthorizationError, match="r must be less than curve order"):
            auth.validate()

    def test_r_n_minus_1_valid(self):
        """r = N - 1 is valid."""
        r_bytes = (SECP256K1_N - 1).to_bytes(32, "big")
        auth = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=r_bytes,
            s=VALID_S,
        )
        assert auth.validate() is True

    def test_s_greater_than_half_n_rejected(self):
        """s > N/2 (malleable signature) is rejected."""
        s_bytes = (SECP256K1_HALF_N + 1).to_bytes(32, "big")
        auth = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=s_bytes,
        )
        with pytest.raises(InvalidAuthorizationError, match="s too high"):
            auth.validate()

    def test_s_equals_half_n_valid(self):
        """s = N/2 is valid."""
        s_bytes = SECP256K1_HALF_N.to_bytes(32, "big")
        auth = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=s_bytes,
        )
        assert auth.validate() is True

    def test_s_equals_1_valid(self):
        """s = 1 is valid."""
        s_bytes = (1).to_bytes(32, "big")
        auth = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=s_bytes,
        )
        assert auth.validate() is True


# ============================================================================
# Signing Hash Tests
# ============================================================================


class TestSigningHash:
    """Tests for Authorization.signing_hash method."""

    def test_signing_hash_returns_32_bytes(self):
        """signing_hash returns 32-byte hash."""
        auth = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        h = auth.signing_hash()
        assert isinstance(h, bytes)
        assert len(h) == 32

    def test_signing_hash_consistent(self):
        """Same parameters produce same hash."""
        auth1 = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=42,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        auth2 = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=42,
            y_parity=1,  # Different signature, but same signing hash
            r=bytes(32),
            s=bytes(32),
        )
        # Signing hash only depends on chain_id, address, nonce
        assert auth1.signing_hash() == auth2.signing_hash()

    def test_signing_hash_different_for_different_nonce(self):
        """Different nonce produces different hash."""
        auth1 = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        auth2 = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=1,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        assert auth1.signing_hash() != auth2.signing_hash()

    def test_signing_hash_different_for_different_chain_id(self):
        """Different chain_id produces different hash."""
        auth1 = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        auth2 = Authorization(
            chain_id=2,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        assert auth1.signing_hash() != auth2.signing_hash()

    def test_signing_hash_different_for_different_address(self):
        """Different address produces different hash."""
        auth1 = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        auth2 = Authorization(
            chain_id=1,
            address=ADDR2,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        assert auth1.signing_hash() != auth2.signing_hash()


# ============================================================================
# Gas Cost Tests
# ============================================================================


class TestGasCost:
    """Tests for Authorization.gas_cost static method."""

    def test_gas_cost_zero_authorizations(self):
        """Zero authorizations costs zero gas."""
        cost = Authorization.gas_cost(0)
        assert cost == 0

    def test_gas_cost_single_authorization(self):
        """Single authorization costs base cost."""
        cost = Authorization.gas_cost(1)
        assert cost == PER_AUTH_BASE_COST

    def test_gas_cost_multiple_authorizations(self):
        """Multiple authorizations scale linearly."""
        cost = Authorization.gas_cost(3)
        assert cost == PER_AUTH_BASE_COST * 3

    def test_gas_cost_with_empty_accounts(self):
        """Empty accounts add extra cost."""
        cost = Authorization.gas_cost(2, empty_accounts=1)
        expected = (PER_AUTH_BASE_COST * 2) + (PER_EMPTY_ACCOUNT_COST * 1)
        assert cost == expected
        assert cost == 50000

    def test_gas_cost_all_empty_accounts(self):
        """All targets are empty accounts."""
        cost = Authorization.gas_cost(2, empty_accounts=2)
        expected = (PER_AUTH_BASE_COST * 2) + (PER_EMPTY_ACCOUNT_COST * 2)
        assert cost == expected
        assert cost == 75000


# ============================================================================
# Equality Tests
# ============================================================================


class TestEquality:
    """Tests for Authorization equality."""

    def test_same_authorization_equal(self):
        """Same parameters are equal."""
        auth1 = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        auth2 = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        assert auth1 == auth2

    def test_different_chain_id_not_equal(self):
        """Different chain_id are not equal."""
        auth1 = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        auth2 = Authorization(
            chain_id=2,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        assert auth1 != auth2

    def test_different_address_not_equal(self):
        """Different address are not equal."""
        auth1 = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        auth2 = Authorization(
            chain_id=1,
            address=ADDR2,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        assert auth1 != auth2

    def test_different_nonce_not_equal(self):
        """Different nonce are not equal."""
        auth1 = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        auth2 = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=1,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        assert auth1 != auth2


# ============================================================================
# Hashability Tests
# ============================================================================


class TestHashability:
    """Tests for Authorization hashability."""

    def test_authorization_is_hashable(self):
        """Authorization can be hashed."""
        auth = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        h = hash(auth)
        assert isinstance(h, int)

    def test_equal_authorizations_same_hash(self):
        """Equal authorizations have same hash."""
        auth1 = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        auth2 = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        assert hash(auth1) == hash(auth2)

    def test_authorization_in_set(self):
        """Authorization can be used in sets."""
        auth1 = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        auth2 = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        auth3 = Authorization(
            chain_id=1,
            address=ADDR2,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        s = {auth1, auth2, auth3}
        assert len(s) == 2


# ============================================================================
# Edge Cases
# ============================================================================


class TestEdgeCases:
    """Tests for edge cases."""

    def test_max_chain_id(self):
        """Maximum chain ID (2^64 - 1) is valid."""
        auth = Authorization(
            chain_id=2**64 - 1,
            address=ADDR1,
            nonce=0,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        assert auth.validate() is True

    def test_max_nonce(self):
        """Maximum nonce (2^64 - 1) is valid."""
        auth = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=2**64 - 1,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        assert auth.validate() is True

    def test_repr(self):
        """repr returns useful string."""
        auth = Authorization(
            chain_id=1,
            address=ADDR1,
            nonce=42,
            y_parity=0,
            r=VALID_R,
            s=VALID_S,
        )
        r = repr(auth)
        assert "Authorization" in r
        assert "chain_id=1" in r
        assert "nonce=42" in r
