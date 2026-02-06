package engine

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Exchanges list of supported Engine API methods
//
// Example:
// Consensus client methods: ...
// Result: ...
//
// Implements the engine_exchangeCapabilities JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "engine_exchangeCapabilities"

// Params represents the parameters for engine_exchangeCapabilities
type Params struct {
	Consensus client methods types.Quantity `json:"-"`
}

// MarshalJSON implements json.Marshaler for Params.
// JSON-RPC 2.0 uses positional array parameters.
func (p Params) MarshalJSON() ([]byte, error) {
	return json.Marshal([]interface{}{
		p.Consensus client methods,
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

	if err := json.Unmarshal(arr[0], &p.Consensus client methods); err != nil {
		return fmt.Errorf("parameter 0 (Consensus client methods): %w", err)
	}

	return nil
}

// Result represents the result for engine_exchangeCapabilities
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
