package primitives

// EIP-2930 Access List implementation
// Access lists optimize gas costs by pre-declaring which addresses and storage keys
// a transaction will access, making subsequent accesses cheaper (warm vs cold).

// AccessListEntry represents a single entry in an access list
// It contains an address and a list of storage keys that will be accessed
type AccessListEntry struct {
	Address     [20]byte   // Ethereum address
	StorageKeys [][32]byte // List of storage keys (hashes)
}

// AccessList is a list of AccessListEntry items
type AccessList []AccessListEntry

// CalculateAccessListGasCost calculates the total gas cost for an access list
//
// Parameters:
//   - accessList: The access list to calculate cost for
//
// Returns:
//   - Total gas cost
func CalculateAccessListGasCost(accessList AccessList) uint64 {
	var totalCost uint64

	for _, entry := range accessList {
		// Cost per address
		totalCost += AccessListAddressCost

		// Cost per storage key
		totalCost += AccessListStorageKeyCost * uint64(len(entry.StorageKeys))
	}

	return totalCost
}

// IsAddressInAccessList checks if an address is in the access list
//
// Parameters:
//   - accessList: The access list to search
//   - addr: The address to look for
//
// Returns:
//   - true if the address is in the access list
func IsAddressInAccessList(accessList AccessList, addr [20]byte) bool {
	for _, entry := range accessList {
		if entry.Address == addr {
			return true
		}
	}
	return false
}

// IsStorageKeyInAccessList checks if a storage key is in the access list for a given address
//
// Parameters:
//   - accessList: The access list to search
//   - addr: The address to check
//   - storageKey: The storage key to look for
//
// Returns:
//   - true if the storage key is in the access list for the address
func IsStorageKeyInAccessList(accessList AccessList, addr [20]byte, storageKey [32]byte) bool {
	for _, entry := range accessList {
		if entry.Address == addr {
			for _, key := range entry.StorageKeys {
				if key == storageKey {
					return true
				}
			}
		}
	}
	return false
}

// CalculateGasSavings calculates potential gas savings from using an access list
// The savings come from the difference between cold and warm access costs
//
// Parameters:
//   - accessList: The access list
//
// Returns:
//   - Total gas savings
func CalculateGasSavings(accessList AccessList) uint64 {
	var savings uint64

	for _, entry := range accessList {
		// Save on cold account access
		savings += ColdAccountAccessCost - AccessListAddressCost

		// Save on cold storage access
		for range entry.StorageKeys {
			savings += ColdSloadCost - AccessListStorageKeyCost
		}
	}

	return savings
}

// DeduplicateAccessList removes duplicate addresses and storage keys from an access list
//
// Parameters:
//   - accessList: The access list to deduplicate
//
// Returns:
//   - Deduplicated access list
func DeduplicateAccessList(accessList AccessList) AccessList {
	result := make(AccessList, 0)

	// Track seen addresses
	seenAddresses := make(map[[20]byte]int)

	for _, entry := range accessList {
		// Check if address already exists
		if existingIdx, found := seenAddresses[entry.Address]; found {
			// Merge storage keys
			existingKeys := result[existingIdx].StorageKeys

			// Track seen keys for this address
			seenKeys := make(map[[32]byte]bool)
			for _, key := range existingKeys {
				seenKeys[key] = true
			}

			// Add new keys if not duplicate
			for _, newKey := range entry.StorageKeys {
				if !seenKeys[newKey] {
					result[existingIdx].StorageKeys = append(result[existingIdx].StorageKeys, newKey)
					seenKeys[newKey] = true
				}
			}
		} else {
			// New address, add it
			seenAddresses[entry.Address] = len(result)

			// Deduplicate storage keys within this entry
			seenKeys := make(map[[32]byte]bool)
			uniqueKeys := make([][32]byte, 0)

			for _, key := range entry.StorageKeys {
				if !seenKeys[key] {
					uniqueKeys = append(uniqueKeys, key)
					seenKeys[key] = true
				}
			}

			result = append(result, AccessListEntry{
				Address:     entry.Address,
				StorageKeys: uniqueKeys,
			})
		}
	}

	return result
}

// ValidateAccessList validates an access list for correctness
//
// Parameters:
//   - accessList: The access list to validate
//
// Returns:
//   - error if validation fails, nil otherwise
func ValidateAccessList(accessList AccessList) error {
	// Access lists are always valid by structure
	// No specific validation rules in EIP-2930
	return nil
}

// CountAccessListItems counts the total number of addresses and storage keys
//
// Parameters:
//   - accessList: The access list to count
//
// Returns:
//   - addressCount: Number of addresses
//   - storageKeyCount: Number of storage keys
func CountAccessListItems(accessList AccessList) (addressCount uint64, storageKeyCount uint64) {
	addressCount = uint64(len(accessList))
	storageKeyCount = 0

	for _, entry := range accessList {
		storageKeyCount += uint64(len(entry.StorageKeys))
	}

	return
}
