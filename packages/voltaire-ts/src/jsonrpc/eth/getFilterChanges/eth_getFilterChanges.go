package eth

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Polling method for the filter with the given ID (created using `eth_newFilter`). Returns an array of logs, block hashes, or transaction hashes since last poll, depending on the installed filter.
//
// Example:
// Filter identifier: "0x01"
// Result: ...
//
// Implements the eth_getFilterChanges JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "eth_getFilterChanges"

// Params represents the parameters for eth_getFilterChanges
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

// Result represents the result for eth_getFilterChanges
//
// Filter results
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
