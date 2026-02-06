package engine

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Runs execution payload validation
//
// Example:
// Execution payload: ...
// Expected blob versioned hashes: ...
// Root of the parent beacon block: "0x169630f535b4a41330164c6e5c92b1224c0c407f582d407d0ac3d206cd32fd52"
// Execution requests: ...
// Result: ...
//
// Implements the engine_newPayloadV4 JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "engine_newPayloadV4"

// Params represents the parameters for engine_newPayloadV4
type Params struct {
	// Execution payload object V3
	Execution payload types.Quantity `json:"-"`
	Expected blob versioned hashes types.Quantity `json:"-"`
	// 32 byte hex value
	Root of the parent beacon block types.Hash `json:"-"`
	Execution requests types.Quantity `json:"-"`
}

// MarshalJSON implements json.Marshaler for Params.
// JSON-RPC 2.0 uses positional array parameters.
func (p Params) MarshalJSON() ([]byte, error) {
	return json.Marshal([]interface{}{
		p.Execution payload,
		p.Expected blob versioned hashes,
		p.Root of the parent beacon block,
		p.Execution requests,
	})
}

// UnmarshalJSON implements json.Unmarshaler for Params.
func (p *Params) UnmarshalJSON(data []byte) error {
	var arr []json.RawMessage
	if err := json.Unmarshal(data, &arr); err != nil {
		return err
	}

	if len(arr) != 4 {
		return fmt.Errorf("expected 4 parameters, got %d", len(arr))
	}

	if err := json.Unmarshal(arr[0], &p.Execution payload); err != nil {
		return fmt.Errorf("parameter 0 (Execution payload): %w", err)
	}

	if err := json.Unmarshal(arr[1], &p.Expected blob versioned hashes); err != nil {
		return fmt.Errorf("parameter 1 (Expected blob versioned hashes): %w", err)
	}

	if err := json.Unmarshal(arr[2], &p.Root of the parent beacon block); err != nil {
		return fmt.Errorf("parameter 2 (Root of the parent beacon block): %w", err)
	}

	if err := json.Unmarshal(arr[3], &p.Execution requests); err != nil {
		return fmt.Errorf("parameter 3 (Execution requests): %w", err)
	}

	return nil
}

// Result represents the result for engine_newPayloadV4
//
// Payload status object deprecating INVALID_BLOCK_HASH status
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
