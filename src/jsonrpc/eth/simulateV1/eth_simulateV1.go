package eth

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Executes a sequence of message calls building on each other's state without creating transactions on the block chain, optionally overriding block and state data
//
// Implements the eth_simulateV1 JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "eth_simulateV1"

// Params represents the parameters for eth_simulateV1
type Params struct {
	// Arguments for eth_simulate
	Payload types.Quantity `json:"-"`
	// Block number, tag, or block hash
	Block tag types.BlockSpec `json:"-"`
}

// MarshalJSON implements json.Marshaler for Params.
// JSON-RPC 2.0 uses positional array parameters.
func (p Params) MarshalJSON() ([]byte, error) {
	return json.Marshal([]interface{}{
		p.Payload,
		p.Block tag,
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

	if err := json.Unmarshal(arr[0], &p.Payload); err != nil {
		return fmt.Errorf("parameter 0 (Payload): %w", err)
	}

	if err := json.Unmarshal(arr[1], &p.Block tag); err != nil {
		return fmt.Errorf("parameter 1 (Block tag): %w", err)
	}

	return nil
}

// Result represents the result for eth_simulateV1
//
// Full results of eth_simulate
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
