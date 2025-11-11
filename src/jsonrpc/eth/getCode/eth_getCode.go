package eth

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Returns code at a given address.
//
// Example:
// Address: "0xa50a51c09a5c451c52bb714527e1974b686d8e77"
// Block: "latest"
// Result: "0x60806040526004361060485763ffffffff7c01000000000000000000000000000000000000000000000000000000006000350416633fa4f2458114604d57806355241077146071575b600080fd5b348015605857600080fd5b50605f6088565b60408051918252519081900360200190f35b348015607c57600080fd5b506086600435608e565b005b60005481565b60008190556040805182815290517f199cd93e851e4c78c437891155e2112093f8f15394aa89dab09e38d6ca0727879181900360200190a1505600a165627a7a723058209d8929142720a69bde2ab3bfa2da6217674b984899b62753979743c0470a2ea70029"
//
// Implements the eth_getCode JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "eth_getCode"

// Params represents the parameters for eth_getCode
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

// Result represents the result for eth_getCode
//
// hex encoded bytes
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
