package eth

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Submits a raw transaction. You can create and sign a transaction externally using a library such as [web3.js](https://web3js.readthedocs.io/) or [ethers.js](https://docs.ethers.org/). For [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844) transactions, the raw form must be the network form. This means it includes the blobs, KZG commitments, and KZG proofs. For [EIP-7594](https://eips.ethereum.org/EIPS/eip-7594) transactions, the raw format must be the network form. This means it includes the blobs, KZG commitments, and cell proofs. The logic for handling the new transaction during fork boundaries are 1. When receiving an encoded transaction with cell proofs before the PeerDAS fork activates, we reject it. Only blob proofs are accepted into the pool. 2. At the time of fork activation, the implementer could (not mandatory) - Drop all old-format transactions - Convert old proofs to new format (computationally expensive) - Convert only when including in a locally produced block 3. After the fork has activated, only txs with cell proofs are accepted via p2p relay. 4. On RPC (eth_sendRawTransaction), txs with blob proofs may still be accepted and will be auto-converted by the node. At implementer discretion, this facility can be deprecated later when users have switched to new client libraries that can create cell proofs.
//
// Example:
// Transaction: "0xf869018203e882520894f17f52151ebef6c7334fad080c5704d77216b732881bc16d674ec80000801ba02da1c48b670996dcb1f447ef9ef00b33033c48a4fe938f420bec3e56bfd24071a062e0aa78a81bf0290afbc3a9d8e9a068e6d74caa66c5e0fa8a46deaae96b0833"
// Result: "0xe670ec64341771606e55d6b4ca35a1a6b75ee3d5145a99d05921026d1527331"
//
// Implements the eth_sendRawTransaction JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "eth_sendRawTransaction"

// Params represents the parameters for eth_sendRawTransaction
type Params struct {
	// hex encoded bytes
	Transaction types.Quantity `json:"-"`
}

// MarshalJSON implements json.Marshaler for Params.
// JSON-RPC 2.0 uses positional array parameters.
func (p Params) MarshalJSON() ([]byte, error) {
	return json.Marshal([]interface{}{
		p.Transaction,
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

	if err := json.Unmarshal(arr[0], &p.Transaction); err != nil {
		return fmt.Errorf("parameter 0 (Transaction): %w", err)
	}

	return nil
}

// Result represents the result for eth_sendRawTransaction
//
// 32 byte hex value
type Result struct {
	Value types.Hash `json:"-"`
}

// MarshalJSON implements json.Marshaler for Result.
func (r Result) MarshalJSON() ([]byte, error) {
	return json.Marshal(r.Value)
}

// UnmarshalJSON implements json.Unmarshaler for Result.
func (r *Result) UnmarshalJSON(data []byte) error {
	return json.Unmarshal(data, &r.Value)
}
