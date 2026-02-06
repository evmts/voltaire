"""
AccessList - EIP-2930 access lists for gas-optimized storage access.
"""

from dataclasses import dataclass
from typing import Iterator, Sequence

from voltaire.errors import InvalidLengthError


# Gas cost constants (EIP-2930)
ADDRESS_COST: int = 2400
STORAGE_KEY_COST: int = 1900
COLD_ACCOUNT_ACCESS_COST: int = 2600
COLD_STORAGE_ACCESS_COST: int = 2100
WARM_STORAGE_ACCESS_COST: int = 100


def _strip_0x(s: str) -> str:
    """Remove 0x prefix if present."""
    if s.startswith(("0x", "0X")):
        return s[2:]
    return s


def _validate_address(data: bytes) -> None:
    """Validate address is exactly 20 bytes."""
    if len(data) != 20:
        raise InvalidLengthError(
            f"Address must be 20 bytes, got {len(data)}"
        )


def _validate_storage_key(data: bytes) -> None:
    """Validate storage key is exactly 32 bytes."""
    if len(data) != 32:
        raise InvalidLengthError(
            f"Storage key must be 32 bytes, got {len(data)}"
        )


@dataclass(frozen=True, slots=True)
class AccessListEntry:
    """
    Single access list entry: address + storage keys.

    An entry represents one address and its associated storage keys
    that will be accessed during transaction execution.

    Example:
        >>> entry = AccessListEntry(
        ...     address=bytes.fromhex("742d35Cc6634C0532925a3b844Bc9e7595f251e3"),
        ...     storage_keys=(bytes(32),)
        ... )
    """

    address: bytes
    """20-byte Ethereum address."""

    storage_keys: tuple[bytes, ...]
    """Tuple of 32-byte storage keys."""

    def __post_init__(self) -> None:
        """Validate address and storage key lengths."""
        _validate_address(self.address)
        for key in self.storage_keys:
            _validate_storage_key(key)

    @classmethod
    def from_dict(cls, d: dict) -> "AccessListEntry":
        """
        Create from dict with 'address' and 'storageKeys' fields.

        Args:
            d: Dictionary with 'address' (hex string) and 'storageKeys' (list of hex strings)

        Returns:
            AccessListEntry instance

        Raises:
            InvalidLengthError: Address not 20 bytes or storage key not 32 bytes
        """
        addr_hex = _strip_0x(d["address"])
        addr_bytes = bytes.fromhex(addr_hex)

        storage_keys = tuple(
            bytes.fromhex(_strip_0x(key))
            for key in d.get("storageKeys", [])
        )

        return cls(address=addr_bytes, storage_keys=storage_keys)

    def to_dict(self) -> dict:
        """
        Convert to dict format (JSON-RPC style).

        Returns:
            Dictionary with 'address' and 'storageKeys' as hex strings
        """
        return {
            "address": "0x" + self.address.hex(),
            "storageKeys": ["0x" + key.hex() for key in self.storage_keys],
        }


@dataclass(frozen=True, slots=True)
class AccessList:
    """
    EIP-2930 access list for type 1/2 transactions.

    Access lists specify addresses and storage keys that will be accessed
    during transaction execution. Declaring these upfront provides gas
    savings because the storage is "warmed" before execution.

    Example:
        >>> al = AccessList.from_list([
        ...     {
        ...         "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
        ...         "storageKeys": ["0x" + "00" * 32]
        ...     }
        ... ])
        >>> print(al.gas_cost())
        4300
    """

    entries: tuple[AccessListEntry, ...] = ()
    """Tuple of access list entries."""

    @classmethod
    def from_list(cls, items: Sequence[dict]) -> "AccessList":
        """
        Create from list of dicts.

        Args:
            items: List of dictionaries with 'address' and 'storageKeys' fields

        Returns:
            AccessList instance
        """
        entries = tuple(AccessListEntry.from_dict(item) for item in items)
        return cls(entries=entries)

    def to_list(self) -> list[dict]:
        """
        Convert to list of dicts.

        Returns:
            List of dictionaries in JSON-RPC format
        """
        return [entry.to_dict() for entry in self.entries]

    def gas_cost(self) -> int:
        """
        Calculate gas cost for this access list.

        Gas = 2400 * num_addresses + 1900 * num_storage_keys

        Returns:
            Total gas cost in gas units
        """
        num_addresses = len(self.entries)
        num_keys = sum(len(entry.storage_keys) for entry in self.entries)
        return ADDRESS_COST * num_addresses + STORAGE_KEY_COST * num_keys

    def address_count(self) -> int:
        """
        Get number of addresses in the access list.

        Returns:
            Number of entries (addresses)
        """
        return len(self.entries)

    def storage_key_count(self) -> int:
        """
        Get total number of storage keys across all entries.

        Returns:
            Total count of storage keys
        """
        return sum(len(entry.storage_keys) for entry in self.entries)

    def is_empty(self) -> bool:
        """
        Check if the access list is empty.

        Returns:
            True if no entries, False otherwise
        """
        return len(self.entries) == 0

    def __len__(self) -> int:
        """Return number of entries."""
        return len(self.entries)

    def __iter__(self) -> Iterator[AccessListEntry]:
        """Iterate over entries."""
        return iter(self.entries)
