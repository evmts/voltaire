//! EIP-2930 Access List types.
//!
//! Access lists specify storage slots accessed during transaction execution,
//! enabling gas savings by pre-warming storage.

use core::fmt;
use core::ops::Deref;

#[cfg(not(feature = "std"))]
use alloc::{vec, vec::Vec};

use crate::error::{Error, Result};
use crate::primitives::{Address, Hash};

/// Maximum storage keys per entry (DoS protection).
pub const MAX_STORAGE_KEYS_PER_ENTRY: usize = 10_000;

/// Maximum entries in an access list (DoS protection).
pub const MAX_ACCESS_LIST_ENTRIES: usize = 1_000;

/// A single access list entry containing an address and its accessed storage keys.
///
/// # Examples
///
/// ```rust
/// use voltaire::primitives::{AccessListEntry, Address, Hash};
///
/// let entry = AccessListEntry {
///     address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045".parse()?,
///     storage_keys: vec![Hash::ZERO],
/// };
/// # Ok::<(), voltaire::Error>(())
/// ```
#[derive(Debug, Clone, PartialEq, Eq, Hash, Default)]
pub struct AccessListEntry {
    /// The contract address being accessed.
    pub address: Address,
    /// Storage keys accessed within this contract.
    pub storage_keys: Vec<Hash>,
}

impl AccessListEntry {
    /// Create a new access list entry.
    #[inline]
    pub fn new(address: Address, storage_keys: Vec<Hash>) -> Self {
        Self { address, storage_keys }
    }

    /// Create an entry with just an address (no storage keys).
    #[inline]
    pub fn address_only(address: Address) -> Self {
        Self {
            address,
            storage_keys: Vec::new(),
        }
    }

    /// Validate the entry against size limits.
    pub fn validate(&self) -> Result<()> {
        if self.storage_keys.len() > MAX_STORAGE_KEYS_PER_ENTRY {
            return Err(Error::InvalidAccessList);
        }
        Ok(())
    }

    /// Check if entry has any storage keys.
    #[inline]
    pub fn has_storage_keys(&self) -> bool {
        !self.storage_keys.is_empty()
    }

    /// Number of storage keys in this entry.
    #[inline]
    pub fn storage_key_count(&self) -> usize {
        self.storage_keys.len()
    }

    /// Check if a specific storage key is in this entry.
    pub fn contains_key(&self, key: &Hash) -> bool {
        self.storage_keys.iter().any(|k| k == key)
    }
}

impl fmt::Display for AccessListEntry {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{} ({} keys)", self.address, self.storage_keys.len())
    }
}

/// An EIP-2930 access list specifying addresses and storage keys accessed during execution.
///
/// Access lists enable gas savings by pre-warming storage slots that will be accessed.
/// They are used in EIP-2930 (Type 1) and EIP-1559 (Type 2) transactions.
///
/// # Examples
///
/// ```rust
/// use voltaire::primitives::{AccessList, AccessListEntry, Address, Hash};
///
/// // Create empty access list
/// let empty = AccessList::empty();
///
/// // Create from entries
/// let entry = AccessListEntry::address_only("0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef".parse()?);
/// let list = AccessList::new(vec![entry]);
///
/// // Iterate
/// for entry in list.iter() {
///     println!("{}: {} keys", entry.address, entry.storage_keys.len());
/// }
/// # Ok::<(), voltaire::Error>(())
/// ```
#[derive(Debug, Clone, PartialEq, Eq, Hash, Default)]
pub struct AccessList(Vec<AccessListEntry>);

impl AccessList {
    /// Create a new access list from entries.
    #[inline]
    pub fn new(entries: Vec<AccessListEntry>) -> Self {
        Self(entries)
    }

    /// Create an empty access list.
    #[inline]
    pub fn empty() -> Self {
        Self(Vec::new())
    }

    /// Create access list with pre-allocated capacity.
    #[inline]
    pub fn with_capacity(capacity: usize) -> Self {
        Self(Vec::with_capacity(capacity))
    }

    /// Validate the access list against size limits.
    pub fn validate(&self) -> Result<()> {
        if self.0.len() > MAX_ACCESS_LIST_ENTRIES {
            return Err(Error::InvalidAccessList);
        }
        for entry in &self.0 {
            entry.validate()?;
        }
        Ok(())
    }

    /// Check if the access list is empty.
    #[inline]
    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }

    /// Number of entries in the access list.
    #[inline]
    pub fn len(&self) -> usize {
        self.0.len()
    }

    /// Total number of storage keys across all entries.
    pub fn total_storage_keys(&self) -> usize {
        self.0.iter().map(|e| e.storage_keys.len()).sum()
    }

    /// Add an entry to the access list.
    #[inline]
    pub fn push(&mut self, entry: AccessListEntry) {
        self.0.push(entry);
    }

    /// Add an address with no storage keys.
    #[inline]
    pub fn push_address(&mut self, address: Address) {
        self.0.push(AccessListEntry::address_only(address));
    }

    /// Add an address with storage keys.
    #[inline]
    pub fn push_entry(&mut self, address: Address, storage_keys: Vec<Hash>) {
        self.0.push(AccessListEntry::new(address, storage_keys));
    }

    /// Get entry by index.
    #[inline]
    pub fn get(&self, index: usize) -> Option<&AccessListEntry> {
        self.0.get(index)
    }

    /// Check if the list contains a specific address.
    pub fn contains_address(&self, address: &Address) -> bool {
        self.0.iter().any(|e| &e.address == address)
    }

    /// Find entry for a specific address.
    pub fn find_address(&self, address: &Address) -> Option<&AccessListEntry> {
        self.0.iter().find(|e| &e.address == address)
    }

    /// Check if a specific storage key is present for an address.
    pub fn contains_storage_key(&self, address: &Address, key: &Hash) -> bool {
        self.find_address(address)
            .map(|e| e.contains_key(key))
            .unwrap_or(false)
    }

    /// Iterate over entries.
    #[inline]
    pub fn iter(&self) -> impl Iterator<Item = &AccessListEntry> {
        self.0.iter()
    }

    /// Get the underlying entries.
    #[inline]
    pub fn entries(&self) -> &[AccessListEntry] {
        &self.0
    }

    /// Consume and return the underlying entries.
    #[inline]
    pub fn into_entries(self) -> Vec<AccessListEntry> {
        self.0
    }

    /// Calculate gas cost for this access list.
    ///
    /// Per EIP-2930:
    /// - 2400 gas per address
    /// - 1900 gas per storage key
    pub fn gas_cost(&self) -> u64 {
        const ADDRESS_COST: u64 = 2400;
        const STORAGE_KEY_COST: u64 = 1900;

        let address_count = self.0.len() as u64;
        let storage_key_count = self.total_storage_keys() as u64;

        address_count * ADDRESS_COST + storage_key_count * STORAGE_KEY_COST
    }

    /// Merge another access list into this one.
    ///
    /// Entries for the same address are combined (storage keys merged).
    pub fn merge(&mut self, other: AccessList) {
        for entry in other.0 {
            if let Some(existing) = self.0.iter_mut().find(|e| e.address == entry.address) {
                // Add only unique storage keys
                for key in entry.storage_keys {
                    if !existing.storage_keys.contains(&key) {
                        existing.storage_keys.push(key);
                    }
                }
            } else {
                self.0.push(entry);
            }
        }
    }

    /// Deduplicate storage keys within each entry.
    pub fn deduplicate(&mut self) {
        for entry in &mut self.0 {
            entry.storage_keys.sort();
            entry.storage_keys.dedup();
        }
    }
}

impl Deref for AccessList {
    type Target = [AccessListEntry];

    #[inline]
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl AsRef<[AccessListEntry]> for AccessList {
    #[inline]
    fn as_ref(&self) -> &[AccessListEntry] {
        &self.0
    }
}

impl From<Vec<AccessListEntry>> for AccessList {
    #[inline]
    fn from(entries: Vec<AccessListEntry>) -> Self {
        Self(entries)
    }
}

impl From<AccessList> for Vec<AccessListEntry> {
    #[inline]
    fn from(list: AccessList) -> Self {
        list.0
    }
}

impl FromIterator<AccessListEntry> for AccessList {
    fn from_iter<T: IntoIterator<Item = AccessListEntry>>(iter: T) -> Self {
        Self(iter.into_iter().collect())
    }
}

impl IntoIterator for AccessList {
    type Item = AccessListEntry;
    type IntoIter = std::vec::IntoIter<AccessListEntry>;

    fn into_iter(self) -> Self::IntoIter {
        self.0.into_iter()
    }
}

impl<'a> IntoIterator for &'a AccessList {
    type Item = &'a AccessListEntry;
    type IntoIter = core::slice::Iter<'a, AccessListEntry>;

    fn into_iter(self) -> Self::IntoIter {
        self.0.iter()
    }
}

impl fmt::Display for AccessList {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "AccessList({} entries, {} keys)",
            self.len(),
            self.total_storage_keys()
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_access_list_empty() {
        let list = AccessList::empty();
        assert!(list.is_empty());
        assert_eq!(list.len(), 0);
        assert_eq!(list.gas_cost(), 0);
    }

    #[test]
    fn test_access_list_entry() {
        let addr = Address::new([1u8; 20]);
        let key = Hash::new([2u8; 32]);
        let entry = AccessListEntry::new(addr, vec![key]);

        assert!(entry.has_storage_keys());
        assert_eq!(entry.storage_key_count(), 1);
        assert!(entry.contains_key(&key));
        assert!(!entry.contains_key(&Hash::ZERO));
    }

    #[test]
    fn test_access_list_push() {
        let mut list = AccessList::empty();
        let addr = Address::new([1u8; 20]);

        list.push_address(addr);
        assert_eq!(list.len(), 1);
        assert!(list.contains_address(&addr));
        assert!(!list.contains_address(&Address::ZERO));
    }

    #[test]
    fn test_access_list_gas_cost() {
        let mut list = AccessList::empty();

        // One address, no keys
        list.push_address(Address::new([1u8; 20]));
        assert_eq!(list.gas_cost(), 2400);

        // Add storage key
        list.push_entry(Address::new([2u8; 20]), vec![Hash::ZERO, Hash::new([1u8; 32])]);
        assert_eq!(list.gas_cost(), 2400 + 2400 + 1900 * 2);
    }

    #[test]
    fn test_access_list_merge() {
        let addr = Address::new([1u8; 20]);
        let key1 = Hash::new([1u8; 32]);
        let key2 = Hash::new([2u8; 32]);

        let mut list1 = AccessList::new(vec![AccessListEntry::new(addr, vec![key1])]);
        let list2 = AccessList::new(vec![AccessListEntry::new(addr, vec![key1, key2])]);

        list1.merge(list2);

        assert_eq!(list1.len(), 1);
        let entry = list1.get(0).unwrap();
        assert_eq!(entry.storage_keys.len(), 2);
        assert!(entry.contains_key(&key1));
        assert!(entry.contains_key(&key2));
    }

    #[test]
    fn test_access_list_validate() {
        let list = AccessList::empty();
        assert!(list.validate().is_ok());

        // Would test limits but that requires large allocations
    }

    #[test]
    fn test_access_list_iteration() {
        let list = AccessList::new(vec![
            AccessListEntry::address_only(Address::new([1u8; 20])),
            AccessListEntry::address_only(Address::new([2u8; 20])),
        ]);

        let addrs: Vec<_> = list.iter().map(|e| e.address).collect();
        assert_eq!(addrs.len(), 2);
    }

    #[test]
    fn test_access_list_contains_storage_key() {
        let addr = Address::new([1u8; 20]);
        let key = Hash::new([1u8; 32]);
        let list = AccessList::new(vec![AccessListEntry::new(addr, vec![key])]);

        assert!(list.contains_storage_key(&addr, &key));
        assert!(!list.contains_storage_key(&addr, &Hash::ZERO));
        assert!(!list.contains_storage_key(&Address::ZERO, &key));
    }

    #[test]
    fn test_access_list_deduplicate() {
        let addr = Address::new([1u8; 20]);
        let key = Hash::new([1u8; 32]);
        let mut list = AccessList::new(vec![AccessListEntry::new(addr, vec![key, key, key])]);

        list.deduplicate();

        assert_eq!(list.get(0).unwrap().storage_keys.len(), 1);
    }

    #[test]
    fn test_access_list_from_iterator() {
        let entries = vec![
            AccessListEntry::address_only(Address::new([1u8; 20])),
            AccessListEntry::address_only(Address::new([2u8; 20])),
        ];

        let list: AccessList = entries.into_iter().collect();
        assert_eq!(list.len(), 2);
    }
}
