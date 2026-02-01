package eth

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Returns the nonce of an account in the state. NOTE: The name eth_getTransactionCount reflects the historical fact that an account's nonce and sent transaction count were the same. After the Pectra fork, with the inclusion of EIP-7702, this is no longer true.
//
// Example:
// Address: "0xc94770007dda54cF92009BFF0dE90c06F603a09f"
// Block: "latest"
// Result: "0x1"
//
// Implements the eth_getTransactionCount JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "eth_getTransactionCount"

// Params represents the parameters for eth_getTransactionCount
type Params struct {
	// hex encoded address
	Address types.Address `json:"-"`
	// Block number, tag, or block hash
	Block types.BlockSpec `json:"-"`
}

// MarshalJSON implements json.Marshaler for Params.
// JSON-RPC 2.0 uses positional array parameters.
func (p Params) MarshalJSON() ([]byte, error) {
	return json.Marshal([]interface{}{
		p.Address,
		p.Block,
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

	if err := json.Unmarshal(arr[0], &p.Address); err != nil {
		return fmt.Errorf("parameter 0 (Address): %w", err)
	}

	if err := json.Unmarshal(arr[1], &p.Block); err != nil {
		return fmt.Errorf("parameter 1 (Block): %w", err)
	}

	return nil
}

// Result represents the result for eth_getTransactionCount
//
// hex encoded unsigned integer
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
