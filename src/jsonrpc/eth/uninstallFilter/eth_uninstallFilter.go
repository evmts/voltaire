package eth

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Uninstalls a filter with given id.
//
// Example:
// Filter identifier: "0x01"
// Result: true
//
// Implements the eth_uninstallFilter JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "eth_uninstallFilter"

// Params represents the parameters for eth_uninstallFilter
type Params struct {
	// hex encoded unsigned integer
	Filter identifier types.Quantity `json:"-"`
}

// MarshalJSON implements json.Marshaler for Params.
// JSON-RPC 2.0 uses positional array parameters.
func (p Params) MarshalJSON() ([]byte, error) {
	return json.Marshal([]interface{}{
		p.Filter identifier,
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

	if err := json.Unmarshal(arr[0], &p.Filter identifier); err != nil {
		return fmt.Errorf("parameter 0 (Filter identifier): %w", err)
	}

	return nil
}

// Result represents the result for eth_uninstallFilter
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
