package eth

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Transaction fee history
//
// Example:
// blockCount: "0x5"
// newestblock: "latest"
// rewardPercentiles: ...
// Result: ...
//
// Implements the eth_feeHistory JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "eth_feeHistory"

// Params represents the parameters for eth_feeHistory
type Params struct {
	// hex encoded unsigned integer
	BlockCount types.Quantity `json:"-"`
	// Block number or tag
	NewestBlock types.Quantity `json:"-"`
	// rewardPercentiles
	RewardPercentiles types.Quantity `json:"-"`
}

// MarshalJSON implements json.Marshaler for Params.
// JSON-RPC 2.0 uses positional array parameters.
func (p Params) MarshalJSON() ([]byte, error) {
	return json.Marshal([]interface{}{
		p.BlockCount,
		p.NewestBlock,
		p.RewardPercentiles,
	})
}

// UnmarshalJSON implements json.Unmarshaler for Params.
func (p *Params) UnmarshalJSON(data []byte) error {
	var arr []json.RawMessage
	if err := json.Unmarshal(data, &arr); err != nil {
		return err
	}

	if len(arr) != 3 {
		return fmt.Errorf("expected 3 parameters, got %d", len(arr))
	}

	if err := json.Unmarshal(arr[0], &p.BlockCount); err != nil {
		return fmt.Errorf("parameter 0 (blockCount): %w", err)
	}

	if err := json.Unmarshal(arr[1], &p.NewestBlock); err != nil {
		return fmt.Errorf("parameter 1 (newestBlock): %w", err)
	}

	if err := json.Unmarshal(arr[2], &p.RewardPercentiles); err != nil {
		return fmt.Errorf("parameter 2 (rewardPercentiles): %w", err)
	}

	return nil
}

// Result represents the result for eth_feeHistory
//
// feeHistoryResults
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
