package eth

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Generates an access list for a transaction.
//
// Example:
// Transaction: ...
// Block: "latest"
// Result: ...
//
// Implements the eth_createAccessList JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "eth_createAccessList"

// Params represents the parameters for eth_createAccessList
type Params struct {
	// Transaction object generic to all types
	Transaction types.Quantity `json:"-"`
	// Block number or tag
	Block types.Quantity `json:"-"`
}

// MarshalJSON implements json.Marshaler for Params.
// JSON-RPC 2.0 uses positional array parameters.
func (p Params) MarshalJSON() ([]byte, error) {
	return json.Marshal([]interface{}{
		p.Transaction,
		p.Block,
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

	if err := json.Unmarshal(arr[0], &p.Transaction); err != nil {
		return fmt.Errorf("parameter 0 (Transaction): %w", err)
	}

	if err := json.Unmarshal(arr[1], &p.Block); err != nil {
		return fmt.Errorf("parameter 1 (Block): %w", err)
	}

	return nil
}

// Result represents the result for eth_createAccessList
//
// Access list result
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
