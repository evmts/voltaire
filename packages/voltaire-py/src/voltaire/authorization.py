"""
Authorization - EIP-7702 authorization tuple for account abstraction.

Allows EOAs to temporarily delegate execution to contract code.
"""

import ctypes
from dataclasses import dataclass
from typing import Any

from voltaire._ffi import (
    PrimitivesAddress,
    PrimitivesHash,
    get_lib,
    c_uint8,
    c_uint64,
    c_size_t,
    POINTER,
    Structure,
)
from voltaire.errors import check_error, InvalidAuthorizationError


# ============================================================================
# Constants
# ============================================================================

# EIP-7702 magic byte for signing hash
MAGIC_BYTE = 0x05

# Gas cost per empty account authorization
PER_EMPTY_ACCOUNT_COST = 25000

# Base gas cost per authorization
PER_AUTH_BASE_COST = 12500

# secp256k1 curve order N
SECP256K1_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141

# secp256k1 curve order N / 2 (for malleability check)
SECP256K1_HALF_N = SECP256K1_N // 2


# ============================================================================
# C Struct
# ============================================================================


class PrimitivesAuthorization(Structure):
    """C-compatible Authorization structure."""

    _fields_ = [
        ("chain_id", c_uint64),
        ("address", PrimitivesAddress),
        ("nonce", c_uint64),
        ("v", c_uint64),
        ("r", c_uint8 * 32),
        ("s", c_uint8 * 32),
    ]


def _setup_authorization_functions(lib: ctypes.CDLL) -> None:
    """Set up C function signatures for authorization API."""
    lib.primitives_authorization_validate.argtypes = [POINTER(PrimitivesAuthorization)]
    lib.primitives_authorization_validate.restype = ctypes.c_int

    lib.primitives_authorization_signing_hash.argtypes = [
        c_uint64,
        POINTER(PrimitivesAddress),
        c_uint64,
        POINTER(PrimitivesHash),
    ]
    lib.primitives_authorization_signing_hash.restype = ctypes.c_int

    lib.primitives_authorization_authority.argtypes = [
        POINTER(PrimitivesAuthorization),
        POINTER(PrimitivesAddress),
    ]
    lib.primitives_authorization_authority.restype = ctypes.c_int

    lib.primitives_authorization_gas_cost.argtypes = [c_size_t, c_size_t]
    lib.primitives_authorization_gas_cost.restype = c_uint64


# Flag to track if we've set up authorization functions
_authorization_setup_done = False


def _ensure_authorization_setup() -> ctypes.CDLL:
    """Ensure authorization C functions are set up."""
    global _authorization_setup_done
    lib = get_lib()
    if not _authorization_setup_done:
        _setup_authorization_functions(lib)
        _authorization_setup_done = True
    return lib


# ============================================================================
# Authorization Class
# ============================================================================


@dataclass(frozen=True, slots=True)
class Authorization:
    """
    EIP-7702 authorization tuple for account abstraction.

    Allows EOAs to temporarily delegate to contract code for a single transaction.

    Attributes:
        chain_id: Target chain ID (0 for cross-chain)
        address: 20-byte contract address to delegate to
        nonce: Signer's nonce at signing time
        y_parity: Signature recovery parameter (0 or 1)
        r: 32-byte signature r component
        s: 32-byte signature s component
    """

    chain_id: int
    address: bytes
    nonce: int
    y_parity: int
    r: bytes
    s: bytes

    def __post_init__(self) -> None:
        """Validate field lengths."""
        if len(self.address) != 20:
            raise ValueError(f"address must be 20 bytes, got {len(self.address)}")
        if len(self.r) != 32:
            raise ValueError(f"r must be 32 bytes, got {len(self.r)}")
        if len(self.s) != 32:
            raise ValueError(f"s must be 32 bytes, got {len(self.s)}")

    def validate(self) -> bool:
        """
        Validate authorization parameters.

        Checks:
        - Address is not zero address
        - y_parity is 0 or 1
        - Signature r is non-zero and less than curve order
        - Signature s is non-zero and not malleable (s <= N/2)

        Returns:
            True if valid

        Raises:
            InvalidAuthorizationError: If validation fails
        """
        # Check address is not zero
        if self.address == bytes(20):
            raise InvalidAuthorizationError("Address cannot be zero address")

        # Check y_parity
        if self.y_parity not in (0, 1):
            raise InvalidAuthorizationError("yParity must be 0 or 1")

        # Check r
        r_int = int.from_bytes(self.r, "big")
        if r_int == 0:
            raise InvalidAuthorizationError("Signature r cannot be zero")
        if r_int >= SECP256K1_N:
            raise InvalidAuthorizationError("Signature r must be less than curve order")

        # Check s
        s_int = int.from_bytes(self.s, "big")
        if s_int == 0:
            raise InvalidAuthorizationError("Signature s cannot be zero")
        if s_int > SECP256K1_HALF_N:
            raise InvalidAuthorizationError("Signature s too high (malleable signature)")

        return True

    def signing_hash(self) -> bytes:
        """
        Get the hash that should be signed for this authorization.

        The signing hash is: keccak256(0x05 || rlp([chain_id, address, nonce]))
        where 0x05 is the EIP-7702 magic byte.

        Returns:
            32-byte Keccak-256 hash
        """
        lib = _ensure_authorization_setup()

        addr = PrimitivesAddress()
        ctypes.memmove(addr.bytes, self.address, 20)

        out_hash = PrimitivesHash()

        result = lib.primitives_authorization_signing_hash(
            c_uint64(self.chain_id),
            ctypes.byref(addr),
            c_uint64(self.nonce),
            ctypes.byref(out_hash),
        )
        check_error(result, "Authorization.signing_hash")

        return bytes(out_hash.bytes)

    def recover_authority(self) -> bytes:
        """
        Recover the authority (signer) address from the signature.

        Returns:
            20-byte address of the signer

        Raises:
            InvalidSignatureError: If signature recovery fails
        """
        lib = _ensure_authorization_setup()

        # Create C struct
        c_auth = PrimitivesAuthorization()
        c_auth.chain_id = self.chain_id
        ctypes.memmove(c_auth.address.bytes, self.address, 20)
        c_auth.nonce = self.nonce
        c_auth.v = self.y_parity
        ctypes.memmove(c_auth.r, self.r, 32)
        ctypes.memmove(c_auth.s, self.s, 32)

        out_address = PrimitivesAddress()

        result = lib.primitives_authorization_authority(
            ctypes.byref(c_auth),
            ctypes.byref(out_address),
        )
        check_error(result, "Authorization.recover_authority")

        return bytes(out_address.bytes)

    @staticmethod
    def gas_cost(auth_count: int, empty_accounts: int = 0) -> int:
        """
        Calculate gas cost for N authorizations.

        Gas = (PER_AUTH_BASE_COST * auth_count) + (PER_EMPTY_ACCOUNT_COST * empty_accounts)

        Args:
            auth_count: Number of authorizations
            empty_accounts: Number of empty account targets (default 0)

        Returns:
            Total gas cost
        """
        lib = _ensure_authorization_setup()
        return lib.primitives_authorization_gas_cost(auth_count, empty_accounts)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "Authorization":
        """
        Create from a dictionary.

        Accepts keys: chainId, address, nonce, yParity, r, s

        Args:
            d: Dictionary with authorization fields

        Returns:
            Authorization instance
        """
        # Parse address
        address = d["address"]
        if isinstance(address, str):
            if address.startswith(("0x", "0X")):
                address = address[2:]
            address = bytes.fromhex(address)

        # Parse r
        r = d["r"]
        if isinstance(r, str):
            if r.startswith(("0x", "0X")):
                r = r[2:]
            r = bytes.fromhex(r)
        # Ensure 32 bytes
        if len(r) < 32:
            r = bytes(32 - len(r)) + r

        # Parse s
        s = d["s"]
        if isinstance(s, str):
            if s.startswith(("0x", "0X")):
                s = s[2:]
            s = bytes.fromhex(s)
        # Ensure 32 bytes
        if len(s) < 32:
            s = bytes(32 - len(s)) + s

        return cls(
            chain_id=d["chainId"],
            address=address,
            nonce=d["nonce"],
            y_parity=d["yParity"],
            r=r,
            s=s,
        )

    def to_dict(self) -> dict[str, Any]:
        """
        Convert to a dictionary.

        Returns:
            Dictionary with keys: chainId, address, nonce, yParity, r, s
        """
        return {
            "chainId": self.chain_id,
            "address": "0x" + self.address.hex(),
            "nonce": self.nonce,
            "yParity": self.y_parity,
            "r": "0x" + self.r.hex(),
            "s": "0x" + self.s.hex(),
        }
