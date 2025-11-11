package eth

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Returns the number of uncles in a block from a block matching the given block hash.
//
// Example:
// Block hash: "0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35"
// Result: "0x1"
//
// Implements the eth_getUncleCountByBlockHash JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "eth_getUncleCountByBlockHash"

// Params represents the parameters for eth_getUncleCountByBlockHash
type Params struct {
	// 32 byte hex value
	Block hash types.Hash `json:"-"`
}

// MarshalJSON implements json.Marshaler for Params.
// JSON-RPC 2.0 uses positional array parameters.
func (p Params) MarshalJSON() ([]byte, error) {
	return json.Marshal([]interface{}{
		p.Block hash,
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

	if err := json.Unmarshal(arr[0], &p.Block hash); err != nil {
		return fmt.Errorf("parameter 0 (Block hash): %w", err)
	}

	return nil
}

// Result represents the result for eth_getUncleCountByBlockHash
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
