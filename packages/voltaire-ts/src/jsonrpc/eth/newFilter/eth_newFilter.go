package eth

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Install a log filter in the server, allowing for later polling. Registers client interest in logs matching the filter, and returns an identifier.
//
// Example:
// Filter: ...
// Result: "0x01"
//
// Implements the eth_newFilter JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "eth_newFilter"

// Params represents the parameters for eth_newFilter
type Params struct {
	// filter
	Filter types.Quantity `json:"-"`
}

// MarshalJSON implements json.Marshaler for Params.
// JSON-RPC 2.0 uses positional array parameters.
func (p Params) MarshalJSON() ([]byte, error) {
	return json.Marshal([]interface{}{
		p.Filter,
	})
}

// UnmarshalJSON implements json.Unmarshaler for Params.
func (p *Params) UnmarshalJSON(data []byte) error {
	var arr []json.RawMessage
	if err := json.Unmarshal(data, &arr); err != nil {
		return err
	}

	if len(arr) != 1 {
		return fmt.Errorf("expected 1 parameters, got %d", len(arr))
	}

	if err := json.Unmarshal(arr[0], &p.Filter); err != nil {
		return fmt.Errorf("parameter 0 (Filter): %w", err)
	}

	return nil
}

// Result represents the result for eth_newFilter
//
// hex encoded unsigned integer
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
