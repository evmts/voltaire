package commands

import (
	"encoding/json"
	"fmt"

	guillotine "github.com/evmts/guillotine/sdks/go"
	"github.com/evmts/guillotine/sdks/go/evm"
	"github.com/evmts/guillotine/sdks/go/primitives"
	"github.com/urfave/cli/v2"
)

// AccessListEntry represents an entry in the access list (EIP-2930)
type AccessListEntry struct {
	Address     string   `json:"address"`
	StorageKeys []string `json:"storageKeys"`
}

// AccessListResponse represents the eth_createAccessList JSON-RPC response
type AccessListResponse struct {
	AccessList []AccessListEntry `json:"accessList"`
	GasUsed    string            `json:"gasUsed"`
	Error      string            `json:"error,omitempty"`
}

// ExecuteAccessList gets access list for a transaction (eth_createAccessList compatible)
func ExecuteAccessList(c *cli.Context) error {
	// Parse JSON-RPC style parameters
	from, err := ParseAddress(c.String("from"))
	if err != nil {
		return fmt.Errorf("invalid from address: %w", err)
	}
	
	var to primitives.Address
	if c.IsSet("to") {
		to, err = ParseAddress(c.String("to"))
		if err != nil {
			return fmt.Errorf("invalid to address: %w", err)
		}
	}
	
	value, err := ParseBigInt(c.String("value"))
	if err != nil {
		return fmt.Errorf("invalid value: %w", err)
	}
	
	data, err := ParseHex(c.String("data"))
	if err != nil {
		return fmt.Errorf("invalid data: %w", err)
	}
	
	gas, err := ParseGas(c.String("gas"))
	if err != nil {
		return fmt.Errorf("invalid gas: %w", err)
	}
	
	// Setup EVM with access list tracking
	vm, err := SetupEVM(c)
	if err != nil {
		return err
	}
	defer vm.Destroy()
	
	// Ensure from has balance
	if err := ExecuteWithBalance(vm, from, value); err != nil {
		return err
	}
	
	// Execute the call to collect access list
	var result *guillotine.CallResult
	var zeroAddr primitives.Address
	if !c.IsSet("to") || to == zeroAddr {
		result, err = vm.Call(evm.Create{
			Caller:   from,
			Value:    value,
			InitCode: data,
			Gas:      gas,
		})
	} else {
		result, err = vm.Call(evm.Call{
			Caller: from,
			To:     to,
			Value:  value,
			Input:  data,
			Gas:    gas,
		})
	}
	
	if err != nil {
		return fmt.Errorf("access list generation failed: %w", err)
	}
	
	// Build the access list from execution results
	accessListMap := make(map[string][]string)
	
	// Add accessed addresses (these were touched but may not have storage accesses)
	for _, addr := range result.AccessedAddresses {
		addrHex := addr.Hex()
		if _, exists := accessListMap[addrHex]; !exists {
			accessListMap[addrHex] = []string{}
		}
	}
	
	// Add storage accesses
	for _, storage := range result.AccessedStorage {
		addrHex := storage.Address.Hex()
		slotHex := fmt.Sprintf("0x%064x", storage.Slot)
		
		// Initialize address entry if it doesn't exist
		if _, exists := accessListMap[addrHex]; !exists {
			accessListMap[addrHex] = []string{}
		}
		
		// Add storage key if not already present
		found := false
		for _, existingSlot := range accessListMap[addrHex] {
			if existingSlot == slotHex {
				found = true
				break
			}
		}
		if !found {
			accessListMap[addrHex] = append(accessListMap[addrHex], slotHex)
		}
	}
	
	// Convert map to sorted slice for consistent output
	var accessList []AccessListEntry
	for addr, storageKeys := range accessListMap {
		// Skip precompiled contracts (addresses 0x1 through 0x9) and the from address
		// as they are implicitly included in transactions
		if isPrecompiled(addr) || addr == from.Hex() {
			continue
		}
		
		entry := AccessListEntry{
			Address:     addr,
			StorageKeys: storageKeys,
		}
		accessList = append(accessList, entry)
	}
	
	// Create the response
	response := AccessListResponse{
		AccessList: accessList,
		GasUsed:    fmt.Sprintf("0x%x", gas - result.GasLeft),
	}
	
	// If execution failed, include error information
	if !result.Success && result.ErrorInfo != "" {
		response.Error = result.ErrorInfo
	}
	
	// Output as JSON
	jsonBytes, err := json.MarshalIndent(response, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal JSON response: %w", err)
	}
	
	fmt.Println(string(jsonBytes))
	return nil
}

// isPrecompiled checks if an address is a precompiled contract
func isPrecompiled(addrHex string) bool {
	// Precompiled contracts are at addresses 0x1 through 0x9
	precompiled := []string{
		"0x0000000000000000000000000000000000000001",
		"0x0000000000000000000000000000000000000002",
		"0x0000000000000000000000000000000000000003",
		"0x0000000000000000000000000000000000000004",
		"0x0000000000000000000000000000000000000005",
		"0x0000000000000000000000000000000000000006",
		"0x0000000000000000000000000000000000000007",
		"0x0000000000000000000000000000000000000008",
		"0x0000000000000000000000000000000000000009",
	}
	
	for _, preAddr := range precompiled {
		if addrHex == preAddr {
			return true
		}
	}
	return false
}