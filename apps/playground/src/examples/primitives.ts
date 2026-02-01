// Primitives examples - imported as raw strings
// These demonstrate the Voltaire primitives API

import abi from "./primitives/abi.ts?raw";
import accessList from "./primitives/access-list.ts?raw";
import address from "./primitives/address.ts?raw";
import authorization from "./primitives/authorization.ts?raw";
import baseFeePerGas from "./primitives/base-fee-per-gas.ts?raw";
import base64 from "./primitives/base64.ts?raw";
import beaconBlockRoot from "./primitives/beacon-block-root.ts?raw";
import blob from "./primitives/blob.ts?raw";
import blockBody from "./primitives/block-body.ts?raw";
import blockHash from "./primitives/block-hash.ts?raw";
import blockHeader from "./primitives/block-header.ts?raw";
import blockNumber from "./primitives/block-number.ts?raw";
import blockStream from "./primitives/block-stream.ts?raw";
import block from "./primitives/block.ts?raw";
import bloomFilter from "./primitives/bloom-filter.ts?raw";
import bytecode from "./primitives/bytecode.ts?raw";
import bytes from "./primitives/bytes.ts?raw";
import bytes32 from "./primitives/bytes32.ts?raw";
import callData from "./primitives/call-data.ts?raw";
import chainId from "./primitives/chain-id.ts?raw";
import chain from "./primitives/chain.ts?raw";
import denomination from "./primitives/denomination.ts?raw";
import domain from "./primitives/domain.ts?raw";
import ens from "./primitives/ens.ts?raw";
import epoch from "./primitives/epoch.ts?raw";
import eventLog from "./primitives/event-log.ts?raw";
import feeMarket from "./primitives/fee-market.ts?raw";
import filterId from "./primitives/filter-id.ts?raw";
import gasEstimate from "./primitives/gas-estimate.ts?raw";
import gasLimit from "./primitives/gas-limit.ts?raw";
import gasPrice from "./primitives/gas-price.ts?raw";
import gasUsed from "./primitives/gas-used.ts?raw";
import hardfork from "./primitives/hardfork.ts?raw";
import hash from "./primitives/hash.ts?raw";
import hex from "./primitives/hex.ts?raw";
import int from "./primitives/int.ts?raw";
import maxFeePerGas from "./primitives/max-fee-per-gas.ts?raw";
import maxPriorityFeePerGas from "./primitives/max-priority-fee-per-gas.ts?raw";
import nonce from "./primitives/nonce.ts?raw";
import opcode from "./primitives/opcode.ts?raw";
import permit from "./primitives/permit.ts?raw";
import privateKey from "./primitives/private-key.ts?raw";
import proof from "./primitives/proof.ts?raw";
import publicKey from "./primitives/public-key.ts?raw";
import receipt from "./primitives/receipt.ts?raw";
import revertReason from "./primitives/revert-reason.ts?raw";
import rlp from "./primitives/rlp.ts?raw";
import selector from "./primitives/selector.ts?raw";
import signature from "./primitives/signature.ts?raw";
import siwe from "./primitives/siwe.ts?raw";
import slot from "./primitives/slot.ts?raw";
import stateRoot from "./primitives/state-root.ts?raw";
import storageKey from "./primitives/storage-key.ts?raw";
import storageValue from "./primitives/storage-value.ts?raw";
import transactionHash from "./primitives/transaction-hash.ts?raw";
import transactionIndex from "./primitives/transaction-index.ts?raw";
import transactionStatus from "./primitives/transaction-status.ts?raw";
import transaction from "./primitives/transaction.ts?raw";
import typedData from "./primitives/typed-data.ts?raw";
import uint from "./primitives/uint.ts?raw";
import uint256 from "./primitives/uint256.ts?raw";
import userOperation from "./primitives/user-operation.ts?raw";
import withdrawal from "./primitives/withdrawal.ts?raw";

export const primitiveExamples: Record<string, string> = {
	// Core types
	"address.ts": address,
	"hex.ts": hex,
	"bytes.ts": bytes,
	"bytes32.ts": bytes32,
	"hash.ts": hash,
	"uint256.ts": uint256,
	"uint.ts": uint,
	"int.ts": int,

	// Encoding
	"rlp.ts": rlp,
	"abi.ts": abi,
	"base64.ts": base64,
	"typed-data.ts": typedData,

	// Transactions
	"transaction.ts": transaction,
	"access-list.ts": accessList,
	"authorization.ts": authorization,
	"signature.ts": signature,
	"nonce.ts": nonce,
	"call-data.ts": callData,

	// Account Abstraction (ERC-4337)
	"user-operation.ts": userOperation,
	"permit.ts": permit,

	// Blocks
	"block.ts": block,
	"block-header.ts": blockHeader,
	"block-body.ts": blockBody,
	"block-hash.ts": blockHash,
	"block-number.ts": blockNumber,
	"block-stream.ts": blockStream,

	// Gas & Fees
	"gas-limit.ts": gasLimit,
	"gas-used.ts": gasUsed,
	"gas-estimate.ts": gasEstimate,
	"gas-price.ts": gasPrice,
	"base-fee-per-gas.ts": baseFeePerGas,
	"max-fee-per-gas.ts": maxFeePerGas,
	"max-priority-fee-per-gas.ts": maxPriorityFeePerGas,
	"fee-market.ts": feeMarket,
	"denomination.ts": denomination,

	// Receipts & Logs
	"receipt.ts": receipt,
	"event-log.ts": eventLog,
	"bloom-filter.ts": bloomFilter,
	"transaction-hash.ts": transactionHash,
	"transaction-index.ts": transactionIndex,
	"transaction-status.ts": transactionStatus,
	"revert-reason.ts": revertReason,

	// Storage & State
	"storage-value.ts": storageValue,
	"storage-key.ts": storageKey,
	"slot.ts": slot,
	"state-root.ts": stateRoot,
	"proof.ts": proof,

	// Keys & Identity
	"private-key.ts": privateKey,
	"public-key.ts": publicKey,
	"ens.ts": ens,
	"siwe.ts": siwe,
	"domain.ts": domain,

	// EVM
	"bytecode.ts": bytecode,
	"opcode.ts": opcode,
	"selector.ts": selector,

	// Chain
	"chain.ts": chain,
	"chain-id.ts": chainId,
	"hardfork.ts": hardfork,
	"epoch.ts": epoch,

	// Filters
	"filter-id.ts": filterId,

	// EIP-4844 (Blobs)
	"blob.ts": blob,
	"beacon-block-root.ts": beaconBlockRoot,

	// Withdrawals
	"withdrawal.ts": withdrawal,
};
