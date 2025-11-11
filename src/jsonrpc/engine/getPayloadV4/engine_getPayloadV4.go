package engine

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Obtains execution payload from payload build process
//
// Example:
// Payload id: "0x0000000038fa5dd"
// Result: ...
//
// Implements the engine_getPayloadV4 JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "engine_getPayloadV4"

// Params represents the parameters for engine_getPayloadV4
type Params struct {
	// 8 hex encoded bytes
	Payload id types.Quantity `json:"-"`
}

// MarshalJSON implements json.Marshaler for Params.
// JSON-RPC 2.0 uses positional array parameters.
func (p Params) MarshalJSON() ([]byte, error) {
	return json.Marshal([]interface{}{
		p.Payload id,
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

	if err := json.Unmarshal(arr[0], &p.Payload id); err != nil {
		return fmt.Errorf("parameter 0 (Payload id): %w", err)
	}

	return nil
}

// Result represents the result for engine_getPayloadV4
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
