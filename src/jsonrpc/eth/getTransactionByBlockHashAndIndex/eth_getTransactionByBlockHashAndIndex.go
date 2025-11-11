package eth

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Returns information about a transaction by block hash and transaction index position.
//
// Example:
// Block hash: "0xbf137c3a7a1ebdfac21252765e5d7f40d115c2757e4a4abee929be88c624fdb7"
// Transaction index: "0x2"
// Result: ...
//
// Implements the eth_getTransactionByBlockHashAndIndex JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "eth_getTransactionByBlockHashAndIndex"

// Params represents the parameters for eth_getTransactionByBlockHashAndIndex
type Params struct {
	// 32 byte hex value
	Block hash types.Hash `json:"-"`
	// hex encoded unsigned integer
	Transaction index types.Quantity `json:"-"`
}

// MarshalJSON implements json.Marshaler for Params.
// JSON-RPC 2.0 uses positional array parameters.
func (p Params) MarshalJSON() ([]byte, error) {
	return json.Marshal([]interface{}{
		p.Block hash,
		p.Transaction index,
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

	if err := json.Unmarshal(arr[0], &p.Block hash); err != nil {
		return fmt.Errorf("parameter 0 (Block hash): %w", err)
	}

	if err := json.Unmarshal(arr[1], &p.Transaction index); err != nil {
		return fmt.Errorf("parameter 1 (Transaction index): %w", err)
	}

	return nil
}

// Result represents the result for eth_getTransactionByBlockHashAndIndex
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
