package eth

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Returns the merkle proof for a given account and optionally some storage keys.
//
// Example:
// Address: "0xe5cB067E90D5Cd1F8052B83562Ae670bA4A211a8"
// StorageKeys: ...
// Block: "latest"
// Result: ...
//
// Implements the eth_getProof JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "eth_getProof"

// Params represents the parameters for eth_getProof
type Params struct {
	// hex encoded address
	Address types.Address `json:"-"`
	// Storage keys
	StorageKeys types.Quantity `json:"-"`
	// Block number, tag, or block hash
	Block types.BlockSpec `json:"-"`
}

// MarshalJSON implements json.Marshaler for Params.
// JSON-RPC 2.0 uses positional array parameters.
func (p Params) MarshalJSON() ([]byte, error) {
	return json.Marshal([]interface{}{
		p.Address,
		p.StorageKeys,
		p.Block,
	})
}

// UnmarshalJSON implements json.Unmarshaler for Params.
func (p *Params) UnmarshalJSON(data []byte) error {
	var arr []json.RawMessage
	if err := json.Unmarshal(data, &arr); err != nil {
		return err
	}

	if len(arr) != 3 {
		return fmt.Errorf("expected 3 parameters, got %d", len(arr))
	}

	if err := json.Unmarshal(arr[0], &p.Address); err != nil {
		return fmt.Errorf("parameter 0 (Address): %w", err)
	}

	if err := json.Unmarshal(arr[1], &p.StorageKeys); err != nil {
		return fmt.Errorf("parameter 1 (StorageKeys): %w", err)
	}

	if err := json.Unmarshal(arr[2], &p.Block); err != nil {
		return fmt.Errorf("parameter 2 (Block): %w", err)
	}

	return nil
}

// Result represents the result for eth_getProof
//
// Account proof
type Result struct {
	Value types.Quantity `json:"-"`
}

// MarshalJSON implements json.Marshaler for Result.
func (r Result) MarshalJSON() ([]byte, error) {
	return json.Marshal(r.Value)
}

// UnmarshalJSON implements json.Unmarshaler for Result.
func (r *Result) UnmarshalJSON(data []byte) error {
	return json.Unmarshal(data, &r.Value)
}
