/**
 * Primitives V2 - Data-first branded types for Ethereum primitives
 *
 * This module provides tree-shakeable, data-first interfaces matching the Zig API.
 * All types are branded primitives (Uint8Array, bigint, string) with methods
 * namespaced on the type itself for optimal tree-shaking.
 *
 * @example
 * ```typescript
 * import { Address } from '@tevm/primitives';
 *
 * // Create from hex
 * const addr = Address.fromHex('0xa0cf798816d4b9b9866b5330eea46a18382f251e');
 *
 * // Use methods
 * const checksum = Address.toChecksummed(addr);
 * const isZero = Address.isZero(addr);
 * ```
 */

// Core primitives
export { Address } from "./Address/index.js";
export * as BrandedAddress from "./Address/internal-index.js";
export { Hash } from "./Hash/index.js";
export * as BrandedHash from "./Hash/index.js";
export * as HashType from "./Hash/HashType.js";
export { Hex } from "./Hex/index.js";
export * as BrandedHex from "./Hex/internal-index.js";

// Numeric types - Unsigned integers
export { Uint } from "./Uint/Uint.js";
export * as BrandedUint from "./Uint/index.js";
export { Uint8 } from "./Uint8/Uint8.js";
export * as BrandedUint8 from "./Uint8/index.js";
export { Uint16 } from "./Uint16/Uint16.js";
export * as BrandedUint16 from "./Uint16/index.js";
export { Uint32 } from "./Uint32/Uint32.js";
export * as BrandedUint32 from "./Uint32/index.js";
export { Uint64 } from "./Uint64/Uint64.js";
export * as BrandedUint64 from "./Uint64/index.js";
export { Uint128 } from "./Uint128/Uint128.js";
export * as BrandedUint128 from "./Uint128/index.js";
export * as Uint256 from "./Uint/index.js"; // Alias for backward compatibility

// Numeric types - Signed integers
export { Int8 } from "./Int8/Int8.js";
export * as BrandedInt8 from "./Int8/index.js";
export { Int16 } from "./Int16/Int16.js";
export * as BrandedInt16 from "./Int16/index.js";
export { Int32 } from "./Int32/Int32.js";
export * as BrandedInt32 from "./Int32/index.js";
export { Int64 } from "./Int64/Int64.js";
export * as BrandedInt64 from "./Int64/index.js";
export { Int128 } from "./Int128/Int128.js";
export * as BrandedInt128 from "./Int128/index.js";
export { Int256 } from "./Int256/Int256.js";
export * as BrandedInt256 from "./Int256/index.js";

// Denomination
export { Wei, Gwei, Ether } from "./Denomination/index.js";
export * as BrandedWei from "./Denomination/wei-index.js";
export * as BrandedGwei from "./Denomination/gwei-index.js";
export * as BrandedEther from "./Denomination/ether-index.js";

// Encoding
export { Rlp } from "./Rlp/index.js";
export * as BrandedRlp from "./Rlp/internal-index.js";
export * as Ssz from "./Ssz/index.js";
export { Abi } from "./Abi/Abi.js";
export * as BrandedAbi from "./Abi/index.js";

// Transactions
export * as Transaction from "./Transaction/index.js";
export { AccessList } from "./AccessList/index.js";
export * as BrandedAccessList from "./AccessList/index.js";
export * as Authorization from "./Authorization/index.js";
export * as BrandedAuthorization from "./Authorization/index.js"; // Re-exported for backward compatibility

// EVM
export { Bytecode } from "./Bytecode/index.js";
export * as BrandedBytecode from "./Bytecode/index.js";
export * as ContractCode from "./ContractCode/index.js";
export * as InitCode from "./InitCode/index.js";
export * as RuntimeCode from "./RuntimeCode/index.js";
export * as Metadata from "./Metadata/index.js";
export * as SourceMap from "./SourceMap/index.js";
export { Opcode } from "./Opcode/index.js";
export * as BrandedOpcode from "./Opcode/Opcode.js";
export * as Gas from "./Gas/index.js";
export * as GasConstants from "./GasConstants/index.js";
export * as GasCosts from "./GasCosts/index.js";
export * as GasUsed from "./GasUsed/index.js";
export * as GasEstimate from "./GasEstimate/index.js";
export * as GasRefund from "./GasRefund/index.js";
export { StorageKey } from "./State/index.js";
export * as BrandedStorageKey from "./State/index.js";
export * as State from "./State/index.js";
export * as Storage from "./Storage/index.js";
export * as Proxy from "./Proxy/index.js";

// Protocol
export { Blob } from "./Blob/index.js";
export * as BrandedBlob from "./Blob/index.js";
export { Chain } from "./Chain/index.js";
export * as BrandedChain from "./Chain/index.js";
export * as FeeMarket from "./FeeMarket/index.js";
export * as BrandedFeeMarket from "./FeeMarket/FeeMarket.js";
export * as Hardfork from "./Hardfork/index.js";
export * as ForkId from "./ForkId/index.js";

// Network & Peer information
export * as NetworkId from "./NetworkId/index.js";
export * as ProtocolVersion from "./ProtocolVersion/index.js";
export * as PeerId from "./PeerId/index.js";
export * as NodeInfo from "./NodeInfo/index.js";
export * as PeerInfo from "./PeerInfo/index.js";

// Consensus layer (post-merge)
export * as Slot from "./Slot/index.js";
export * as Epoch from "./Epoch/index.js";
export * as ValidatorIndex from "./ValidatorIndex/index.js";
export * as WithdrawalIndex from "./WithdrawalIndex/index.js";
export * as BeaconBlockRoot from "./BeaconBlockRoot/index.js";
export * as Withdrawal from "./Withdrawal/index.js";

// Block types
export * as Block from "./Block/index.js";
export * as BlockBody from "./BlockBody/index.js";
export * as BlockHeader from "./BlockHeader/index.js";
export * as Uncle from "./Uncle/index.js";

// Events & Logs
export { EventLog } from "./EventLog/EventLog.js";
export * as BrandedEventLog from "./EventLog/index.js";

// Filters
export * as FilterId from "./FilterId/index.js";
export * as TopicFilter from "./TopicFilter/index.js";
export * as LogFilter from "./LogFilter/index.js";
export * as BlockFilter from "./BlockFilter/index.js";
export * as PendingTransactionFilter from "./PendingTransactionFilter/index.js";

// Contract interaction results
export * as ReturnData from "./ReturnData/index.js";
export * as RevertReason from "./RevertReason/index.js";
export * as ContractResult from "./ContractResult/index.js";
export * as EncodedData from "./EncodedData/index.js";
export * as DecodedData from "./DecodedData/index.js";

// Compiler & Source metadata
export * as CompilerVersion from "./CompilerVersion/index.js";
export * as License from "./License/index.js";

// Execution tracing (debug_trace* methods)
export * as TraceConfig from "./TraceConfig/index.js";
export * as OpStep from "./OpStep/index.js";
export * as StructLog from "./StructLog/index.js";
export * as CallTrace from "./CallTrace/index.js";
export * as TraceResult from "./TraceResult/index.js";
export * as MemoryDump from "./MemoryDump/index.js";
export * as StorageDiff from "./StorageDiff/index.js";
export * as StateDiff from "./StateDiff/index.js";
export * as SyncStatus from "./SyncStatus/index.js";
export * as ChainHead from "./ChainHead/index.js";

// Function & Event Selectors
export * as Selector from "./Selector/index.js";
export * as FunctionSignature from "./FunctionSignature/index.js";
export * as EventSignature from "./EventSignature/index.js";
export * as ErrorSignature from "./ErrorSignature/index.js";

// Receipts & Transaction Metadata
export * as TransactionHash from "./TransactionHash/index.js";
export * as TransactionIndex from "./TransactionIndex/index.js";
export * as LogIndex from "./LogIndex/index.js";
export * as TransactionStatus from "./TransactionStatus/index.js";
export * as BlockHash from "./BlockHash/index.js";
export * as BlockNumber from "./BlockNumber/index.js";
export * as Receipt from "./Receipt/index.js";

// Standards
export { Siwe } from "./Siwe/index.js";
export * as BrandedSiwe from "./Siwe/index.js";
export * as Ens from "./Ens/index.js";
export * as Permit from "./Permit/index.js";
export * as TransactionUrl from "./TransactionUrl/index.js";

// EIP-712 Typed Data
export * as DomainSeparator from "./DomainSeparator/index.js";
export * as Domain from "./Domain/index.js";
export * as TypedData from "./TypedData/index.js";

// Signatures (EIP-191, EIP-1271)
export * as SignedData from "./SignedData/index.js";
export * as ContractSignature from "./ContractSignature/index.js";

// Privacy (ERC-5564)
export * as StealthAddress from "./StealthAddress/index.js";

// Data structures
export * as BinaryTree from "./BinaryTree/index.js";
export * as BrandedBinaryTree from "./BinaryTree/index.js";
export { BloomFilter } from "./BloomFilter/index.js";
export * as BrandedBloomFilter from "./BloomFilter/index.js";

// Utilities - Base64
export * as Base64 from "./Base64/index.js";
export * as BrandedBase64 from "./Base64/Base64.js";

// Utilities - Bytes types
export { Bytes } from "./Bytes/Bytes.js";
export * as BrandedBytes from "./Bytes/Bytes.index.js";
export { Bytes1 } from "./Bytes/Bytes1/index.js";
export * as BrandedBytes1 from "./Bytes/Bytes1/index.js";
export * as Bytes2 from "./Bytes/Bytes2/index.js";
export * as Bytes3 from "./Bytes/Bytes3/index.js";
export { Bytes4 } from "./Bytes/Bytes4/index.js";
export * as BrandedBytes4 from "./Bytes/Bytes4/index.js";
export * as Bytes5 from "./Bytes/Bytes5/index.js";
export * as Bytes6 from "./Bytes/Bytes6/index.js";
export * as Bytes7 from "./Bytes/Bytes7/index.js";
export { Bytes8 } from "./Bytes/Bytes8/index.js";
export * as BrandedBytes8 from "./Bytes/Bytes8/index.js";
export { Bytes16 } from "./Bytes/Bytes16/index.js";
export * as BrandedBytes16 from "./Bytes/Bytes16/index.js";
export { Bytes32 } from "./Bytes/Bytes32/index.js";
export * as BrandedBytes32 from "./Bytes/Bytes32/index.js";
export { Bytes64 } from "./Bytes/Bytes64/index.js";
export * as BrandedBytes64 from "./Bytes/Bytes64/index.js";

// Errors
export * from "./errors/index.js";
