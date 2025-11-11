package engine

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Given a range of block numbers returns bodies of the corresponding execution payloads
//
// Example:
// Starting block number: "0x20"
// Number of blocks to return: "0x2"
// Result: ...
//
// Implements the engine_getPayloadBodiesByRangeV1 JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "engine_getPayloadBodiesByRangeV1"

// Params represents the parameters for engine_getPayloadBodiesByRangeV1
type Params struct {
	// hex encoded 64 bit unsigned integer
	Starting block number types.Quantity `json:"-"`
	// hex encoded 64 bit unsigned integer
	Number of blocks to return types.Quantity `json:"-"`
}

// MarshalJSON implements json.Marshaler for Params.
// JSON-RPC 2.0 uses positional array parameters.
func (p Params) MarshalJSON() ([]byte, error) {
	return json.Marshal([]interface{}{
		p.Starting block number,
		p.Number of blocks to return,
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

	if err := json.Unmarshal(arr[0], &p.Starting block number); err != nil {
		return fmt.Errorf("parameter 0 (Starting block number): %w", err)
	}

	if err := json.Unmarshal(arr[1], &p.Number of blocks to return); err != nil {
		return fmt.Errorf("parameter 1 (Number of blocks to return): %w", err)
	}

	return nil
}

// Result represents the result for engine_getPayloadBodiesByRangeV1
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
