package eth

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Returns the number of transactions in a block from a block matching the given block hash.
//
// Example:
// Block hash: "0xb903239f8543d04b5dc1ba6579132b143087c68db1b2168786408fcbce568238"
// Result: "0x8"
//
// Implements the eth_getBlockTransactionCountByHash JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "eth_getBlockTransactionCountByHash"

// Params represents the parameters for eth_getBlockTransactionCountByHash
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

// Result represents the result for eth_getBlockTransactionCountByHash
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
