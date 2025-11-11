package eth

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Returns the value from a storage position at a given address.
//
// Example:
// Address: "0xfe3b557e8fb62b89f4916b721be55ceb828dbd73"
// Storage slot: "0x0"
// Block: "latest"
// Result: "0x0000000000000000000000000000000000000000000000000000000000000000"
//
// Implements the eth_getStorageAt JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "eth_getStorageAt"

// Params represents the parameters for eth_getStorageAt
type Params struct {
	// hex encoded address
	Address types.Address `json:"-"`
	// 32 hex encoded bytes
	Storage slot types.Quantity `json:"-"`
	// Block number, tag, or block hash
	Block types.BlockSpec `json:"-"`
}

// MarshalJSON implements json.Marshaler for Params.
// JSON-RPC 2.0 uses positional array parameters.
func (p Params) MarshalJSON() ([]byte, error) {
	return json.Marshal([]interface{}{
		p.Address,
		p.Storage slot,
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

	if err := json.Unmarshal(arr[1], &p.Storage slot); err != nil {
		return fmt.Errorf("parameter 1 (Storage slot): %w", err)
	}

	if err := json.Unmarshal(arr[2], &p.Block); err != nil {
		return fmt.Errorf("parameter 2 (Block): %w", err)
	}

	return nil
}

// Result represents the result for eth_getStorageAt
//
// hex encoded bytes
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
