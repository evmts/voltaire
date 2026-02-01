package eth

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Returns information about a block by hash.
//
// Example:
// Block hash: "0xd5f1812548be429cbdc6376b29611fc49e06f1359758c4ceaaa3b393e2239f9c"
// Hydrated transactions: false
// Result: ...
//
// Implements the eth_getBlockByHash JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "eth_getBlockByHash"

// Params represents the parameters for eth_getBlockByHash
type Params struct {
	// 32 byte hex value
	Block hash types.Hash `json:"-"`
	// hydrated
	Hydrated transactions types.Quantity `json:"-"`
}

// MarshalJSON implements json.Marshaler for Params.
// JSON-RPC 2.0 uses positional array parameters.
func (p Params) MarshalJSON() ([]byte, error) {
	return json.Marshal([]interface{}{
		p.Block hash,
		p.Hydrated transactions,
	})
}

// UnmarshalJSON implements json.Unmarshaler for Params.
func (p *Params) UnmarshalJSON(data []byte) error {
	var arr []json.RawMessage
	if err := json.Unmarshal(data, &arr); err != nil {
		return err
	}

	if len(arr) != 2 {
		return fmt.Errorf("expected 2 parameters, got %d", len(arr))
	}

	if err := json.Unmarshal(arr[0], &p.Block hash); err != nil {
		return fmt.Errorf("parameter 0 (Block hash): %w", err)
	}

	if err := json.Unmarshal(arr[1], &p.Hydrated transactions); err != nil {
		return fmt.Errorf("parameter 1 (Hydrated transactions): %w", err)
	}

	return nil
}

// Result represents the result for eth_getBlockByHash
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
