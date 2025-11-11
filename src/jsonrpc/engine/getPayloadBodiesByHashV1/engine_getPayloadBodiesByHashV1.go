package engine

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Given block hashes returns bodies of the corresponding execution payloads
//
// Example:
// Array of block hashes: ...
// Result: ...
//
// Implements the engine_getPayloadBodiesByHashV1 JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "engine_getPayloadBodiesByHashV1"

// Params represents the parameters for engine_getPayloadBodiesByHashV1
type Params struct {
	Array of block hashes types.Quantity `json:"-"`
}

// MarshalJSON implements json.Marshaler for Params.
// JSON-RPC 2.0 uses positional array parameters.
func (p Params) MarshalJSON() ([]byte, error) {
	return json.Marshal([]interface{}{
		p.Array of block hashes,
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

	if err := json.Unmarshal(arr[0], &p.Array of block hashes); err != nil {
		return fmt.Errorf("parameter 0 (Array of block hashes): %w", err)
	}

	return nil
}

// Result represents the result for engine_getPayloadBodiesByHashV1
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
