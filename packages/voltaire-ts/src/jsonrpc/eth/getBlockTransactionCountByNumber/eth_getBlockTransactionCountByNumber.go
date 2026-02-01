package eth

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Returns the number of transactions in a block matching the given block number.
//
// Example:
// Block: "0xe8"
// Result: "0x8"
//
// Implements the eth_getBlockTransactionCountByNumber JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "eth_getBlockTransactionCountByNumber"

// Params represents the parameters for eth_getBlockTransactionCountByNumber
type Params struct {
	// Block number or tag
	Block types.Quantity `json:"-"`
}

// MarshalJSON implements json.Marshaler for Params.
// JSON-RPC 2.0 uses positional array parameters.
func (p Params) MarshalJSON() ([]byte, error) {
	return json.Marshal([]interface{}{
		p.Block,
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

	if err := json.Unmarshal(arr[0], &p.Block); err != nil {
		return fmt.Errorf("parameter 0 (Block): %w", err)
	}

	return nil
}

// Result represents the result for eth_getBlockTransactionCountByNumber
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
