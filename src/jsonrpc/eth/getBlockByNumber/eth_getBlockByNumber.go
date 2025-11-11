package eth

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Returns information about a block by number.
//
// Example:
// block: "0x68b3"
// Hydrated transactions: false
// Result: ...
//
// Implements the eth_getBlockByNumber JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "eth_getBlockByNumber"

// Params represents the parameters for eth_getBlockByNumber
type Params struct {
	// Block number or tag
	Block types.Quantity `json:"-"`
	// hydrated
	Hydrated transactions types.Quantity `json:"-"`
}

// MarshalJSON implements json.Marshaler for Params.
// JSON-RPC 2.0 uses positional array parameters.
func (p Params) MarshalJSON() ([]byte, error) {
	return json.Marshal([]interface{}{
		p.Block,
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

	if err := json.Unmarshal(arr[0], &p.Block); err != nil {
		return fmt.Errorf("parameter 0 (Block): %w", err)
	}

	if err := json.Unmarshal(arr[1], &p.Hydrated transactions); err != nil {
		return fmt.Errorf("parameter 1 (Hydrated transactions): %w", err)
	}

	return nil
}

// Result represents the result for eth_getBlockByNumber
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
