package engine

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Updates the forkchoice state
//
// Example:
// Forkchoice state: ...
// Payload attributes: ...
// Result: ...
//
// Implements the engine_forkchoiceUpdatedV3 JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "engine_forkchoiceUpdatedV3"

// Params represents the parameters for engine_forkchoiceUpdatedV3
type Params struct {
	// Forkchoice state object V1
	Forkchoice state types.Quantity `json:"-"`
	// Payload attributes object V3
	Payload attributes types.Quantity `json:"-"`
}

// MarshalJSON implements json.Marshaler for Params.
// JSON-RPC 2.0 uses positional array parameters.
func (p Params) MarshalJSON() ([]byte, error) {
	return json.Marshal([]interface{}{
		p.Forkchoice state,
		p.Payload attributes,
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

	if err := json.Unmarshal(arr[0], &p.Forkchoice state); err != nil {
		return fmt.Errorf("parameter 0 (Forkchoice state): %w", err)
	}

	if err := json.Unmarshal(arr[1], &p.Payload attributes); err != nil {
		return fmt.Errorf("parameter 1 (Payload attributes): %w", err)
	}

	return nil
}

// Result represents the result for engine_forkchoiceUpdatedV3
//
// Forkchoice updated response
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
