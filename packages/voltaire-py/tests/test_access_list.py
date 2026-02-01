"""Tests for AccessList module."""

import pytest
from voltaire.access_list import (
    AccessList,
    AccessListEntry,
    ADDRESS_COST,
    STORAGE_KEY_COST,
    COLD_ACCOUNT_ACCESS_COST,
    COLD_STORAGE_ACCESS_COST,
    WARM_STORAGE_ACCESS_COST,
)
from voltaire.errors import InvalidLengthError


class TestAccessListEntry:
    """Tests for AccessListEntry dataclass."""

    def test_create_entry(self):
        """Create entry with address and storage keys."""
        addr = bytes(20)
        key = bytes(32)
        entry = AccessListEntry(address=addr, storage_keys=(key,))
        assert entry.address == addr
        assert entry.storage_keys == (key,)

    def test_create_entry_empty_storage_keys(self):
        """Create entry with no storage keys."""
        addr = bytes(20)
        entry = AccessListEntry(address=addr, storage_keys=())
        assert entry.address == addr
        assert entry.storage_keys == ()

    def test_create_entry_multiple_storage_keys(self):
        """Create entry with multiple storage keys."""
        addr = bytes(20)
        keys = (bytes(32), bytes([1] * 32), bytes([255] * 32))
        entry = AccessListEntry(address=addr, storage_keys=keys)
        assert len(entry.storage_keys) == 3

    def test_entry_is_immutable(self):
        """Entry is frozen dataclass."""
        entry = AccessListEntry(address=bytes(20), storage_keys=())
        with pytest.raises(AttributeError):
            entry.address = bytes(20)

    def test_entry_equality(self):
        """Equal entries compare equal."""
        addr = bytes.fromhex("742d35Cc6634C0532925a3b844Bc9e7595f251e3")
        key = bytes(32)
        entry1 = AccessListEntry(address=addr, storage_keys=(key,))
        entry2 = AccessListEntry(address=addr, storage_keys=(key,))
        assert entry1 == entry2

    def test_entry_inequality(self):
        """Different entries compare not equal."""
        entry1 = AccessListEntry(address=bytes(20), storage_keys=())
        entry2 = AccessListEntry(address=bytes([1] + [0] * 19), storage_keys=())
        assert entry1 != entry2


class TestAccessListEntryFromDict:
    """Tests for AccessListEntry.from_dict factory method."""

    def test_from_dict_with_prefix(self):
        """Parse dict with 0x-prefixed hex strings."""
        d = {
            "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
            "storageKeys": [
                "0x0000000000000000000000000000000000000000000000000000000000000001"
            ],
        }
        entry = AccessListEntry.from_dict(d)
        assert entry.address == bytes.fromhex("742d35Cc6634C0532925a3b844Bc9e7595f251e3")
        assert len(entry.storage_keys) == 1
        assert entry.storage_keys[0] == bytes.fromhex(
            "0000000000000000000000000000000000000000000000000000000000000001"
        )

    def test_from_dict_without_prefix(self):
        """Parse dict without 0x prefix."""
        d = {
            "address": "742d35Cc6634C0532925a3b844Bc9e7595f251e3",
            "storageKeys": [
                "0000000000000000000000000000000000000000000000000000000000000001"
            ],
        }
        entry = AccessListEntry.from_dict(d)
        assert entry.address == bytes.fromhex("742d35Cc6634C0532925a3b844Bc9e7595f251e3")

    def test_from_dict_empty_storage_keys(self):
        """Parse dict with empty storage keys."""
        d = {
            "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
            "storageKeys": [],
        }
        entry = AccessListEntry.from_dict(d)
        assert entry.storage_keys == ()

    def test_from_dict_invalid_address_length(self):
        """Reject dict with wrong address length."""
        d = {
            "address": "0x1234",  # Too short
            "storageKeys": [],
        }
        with pytest.raises(InvalidLengthError):
            AccessListEntry.from_dict(d)

    def test_from_dict_invalid_storage_key_length(self):
        """Reject dict with wrong storage key length."""
        d = {
            "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
            "storageKeys": ["0x1234"],  # Too short
        }
        with pytest.raises(InvalidLengthError):
            AccessListEntry.from_dict(d)


class TestAccessListEntryToDict:
    """Tests for AccessListEntry.to_dict method."""

    def test_to_dict(self):
        """Convert entry to dict format."""
        addr = bytes.fromhex("742d35Cc6634C0532925a3b844Bc9e7595f251e3")
        key = bytes.fromhex(
            "0000000000000000000000000000000000000000000000000000000000000001"
        )
        entry = AccessListEntry(address=addr, storage_keys=(key,))
        d = entry.to_dict()
        assert d["address"] == "0x742d35cc6634c0532925a3b844bc9e7595f251e3"
        assert len(d["storageKeys"]) == 1
        assert (
            d["storageKeys"][0]
            == "0x0000000000000000000000000000000000000000000000000000000000000001"
        )

    def test_to_dict_empty_storage_keys(self):
        """Convert entry with empty storage keys."""
        entry = AccessListEntry(address=bytes(20), storage_keys=())
        d = entry.to_dict()
        assert d["storageKeys"] == []

    def test_roundtrip(self):
        """from_dict/to_dict roundtrip preserves data."""
        original = {
            "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
            "storageKeys": [
                "0x0000000000000000000000000000000000000000000000000000000000000001",
                "0x0000000000000000000000000000000000000000000000000000000000000002",
            ],
        }
        entry = AccessListEntry.from_dict(original)
        result = entry.to_dict()
        # Address is lowercased
        assert result["address"] == original["address"].lower()
        assert len(result["storageKeys"]) == len(original["storageKeys"])


class TestAccessList:
    """Tests for AccessList dataclass."""

    def test_create_empty(self):
        """Create empty access list."""
        al = AccessList()
        assert al.entries == ()
        assert len(al) == 0
        assert al.is_empty()

    def test_create_with_entries(self):
        """Create access list with entries."""
        entry = AccessListEntry(address=bytes(20), storage_keys=())
        al = AccessList(entries=(entry,))
        assert len(al) == 1
        assert not al.is_empty()

    def test_iteration(self):
        """Iterate over entries."""
        entry1 = AccessListEntry(address=bytes(20), storage_keys=())
        entry2 = AccessListEntry(address=bytes([1] + [0] * 19), storage_keys=())
        al = AccessList(entries=(entry1, entry2))
        entries = list(al)
        assert entries == [entry1, entry2]

    def test_equality(self):
        """Equal access lists compare equal."""
        entry = AccessListEntry(address=bytes(20), storage_keys=())
        al1 = AccessList(entries=(entry,))
        al2 = AccessList(entries=(entry,))
        assert al1 == al2

    def test_is_immutable(self):
        """AccessList is frozen dataclass."""
        al = AccessList()
        with pytest.raises(AttributeError):
            al.entries = ()


class TestAccessListFromList:
    """Tests for AccessList.from_list factory method."""

    def test_from_list_single_entry(self):
        """Create from single-entry list."""
        items = [
            {
                "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
                "storageKeys": [],
            }
        ]
        al = AccessList.from_list(items)
        assert len(al) == 1

    def test_from_list_multiple_entries(self):
        """Create from multi-entry list."""
        items = [
            {"address": "0x" + "11" * 20, "storageKeys": []},
            {"address": "0x" + "22" * 20, "storageKeys": []},
            {"address": "0x" + "33" * 20, "storageKeys": []},
        ]
        al = AccessList.from_list(items)
        assert len(al) == 3

    def test_from_list_empty(self):
        """Create from empty list."""
        al = AccessList.from_list([])
        assert al.is_empty()

    def test_from_list_with_storage_keys(self):
        """Create from list with storage keys."""
        items = [
            {
                "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
                "storageKeys": [
                    "0x" + "00" * 31 + "01",
                    "0x" + "00" * 31 + "02",
                ],
            }
        ]
        al = AccessList.from_list(items)
        assert al.storage_key_count() == 2


class TestAccessListToList:
    """Tests for AccessList.to_list method."""

    def test_to_list(self):
        """Convert to list of dicts."""
        items = [
            {
                "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
                "storageKeys": ["0x" + "00" * 31 + "01"],
            }
        ]
        al = AccessList.from_list(items)
        result = al.to_list()
        assert len(result) == 1
        assert result[0]["address"].startswith("0x")
        assert len(result[0]["storageKeys"]) == 1

    def test_to_list_empty(self):
        """Convert empty access list."""
        al = AccessList()
        result = al.to_list()
        assert result == []


class TestAccessListGasCost:
    """Tests for AccessList.gas_cost method."""

    def test_gas_cost_empty(self):
        """Empty list has zero cost."""
        al = AccessList()
        assert al.gas_cost() == 0

    def test_gas_cost_address_only(self):
        """Cost for address without storage keys."""
        items = [{"address": "0x" + "11" * 20, "storageKeys": []}]
        al = AccessList.from_list(items)
        assert al.gas_cost() == ADDRESS_COST

    def test_gas_cost_with_storage_key(self):
        """Cost for address with one storage key."""
        items = [
            {
                "address": "0x" + "11" * 20,
                "storageKeys": ["0x" + "00" * 32],
            }
        ]
        al = AccessList.from_list(items)
        assert al.gas_cost() == ADDRESS_COST + STORAGE_KEY_COST

    def test_gas_cost_multiple_entries(self):
        """Cost for multiple entries with keys."""
        items = [
            {
                "address": "0x" + "11" * 20,
                "storageKeys": ["0x" + "00" * 32, "0x" + "01" * 32],
            },
            {
                "address": "0x" + "22" * 20,
                "storageKeys": ["0x" + "00" * 32],
            },
        ]
        al = AccessList.from_list(items)
        expected = 2 * ADDRESS_COST + 3 * STORAGE_KEY_COST
        assert al.gas_cost() == expected

    def test_gas_cost_formula(self):
        """Verify gas cost formula: 2400*addresses + 1900*keys."""
        items = [
            {"address": "0x" + f"{i:02x}" * 20, "storageKeys": ["0x" + "00" * 32] * i}
            for i in range(1, 4)
        ]
        al = AccessList.from_list(items)
        # 3 addresses, 1+2+3=6 storage keys
        expected = 3 * 2400 + 6 * 1900
        assert al.gas_cost() == expected


class TestAccessListCounts:
    """Tests for AccessList count methods."""

    def test_address_count_empty(self):
        """Empty list has zero addresses."""
        al = AccessList()
        assert al.address_count() == 0

    def test_address_count(self):
        """Count addresses correctly."""
        items = [
            {"address": "0x" + "11" * 20, "storageKeys": []},
            {"address": "0x" + "22" * 20, "storageKeys": []},
        ]
        al = AccessList.from_list(items)
        assert al.address_count() == 2

    def test_storage_key_count_empty(self):
        """Empty list has zero storage keys."""
        al = AccessList()
        assert al.storage_key_count() == 0

    def test_storage_key_count(self):
        """Count storage keys correctly."""
        items = [
            {
                "address": "0x" + "11" * 20,
                "storageKeys": ["0x" + "00" * 32, "0x" + "01" * 32],
            },
            {
                "address": "0x" + "22" * 20,
                "storageKeys": ["0x" + "00" * 32],
            },
        ]
        al = AccessList.from_list(items)
        assert al.storage_key_count() == 3


class TestGasConstants:
    """Tests for gas cost constants."""

    def test_address_cost(self):
        """ADDRESS_COST is 2400."""
        assert ADDRESS_COST == 2400

    def test_storage_key_cost(self):
        """STORAGE_KEY_COST is 1900."""
        assert STORAGE_KEY_COST == 1900

    def test_cold_account_access_cost(self):
        """COLD_ACCOUNT_ACCESS_COST is 2600."""
        assert COLD_ACCOUNT_ACCESS_COST == 2600

    def test_cold_storage_access_cost(self):
        """COLD_STORAGE_ACCESS_COST is 2100."""
        assert COLD_STORAGE_ACCESS_COST == 2100

    def test_warm_storage_access_cost(self):
        """WARM_STORAGE_ACCESS_COST is 100."""
        assert WARM_STORAGE_ACCESS_COST == 100


class TestAccessListHash:
    """Tests for AccessList hashability."""

    def test_entry_is_hashable(self):
        """AccessListEntry can be hashed."""
        entry = AccessListEntry(address=bytes(20), storage_keys=())
        h = hash(entry)
        assert isinstance(h, int)

    def test_access_list_is_hashable(self):
        """AccessList can be hashed."""
        al = AccessList()
        h = hash(al)
        assert isinstance(h, int)

    def test_can_use_in_set(self):
        """AccessList can be used in sets."""
        al1 = AccessList()
        al2 = AccessList()
        al3 = AccessList.from_list([{"address": "0x" + "11" * 20, "storageKeys": []}])
        s = {al1, al2, al3}
        assert len(s) == 2  # al1 and al2 are equal


class TestAccessListRepr:
    """Tests for AccessList string representation."""

    def test_entry_repr(self):
        """AccessListEntry has useful repr."""
        entry = AccessListEntry(address=bytes(20), storage_keys=())
        r = repr(entry)
        assert "AccessListEntry" in r

    def test_access_list_repr(self):
        """AccessList has useful repr."""
        al = AccessList()
        r = repr(al)
        assert "AccessList" in r
