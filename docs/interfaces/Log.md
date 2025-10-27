[**@tevm/primitives**](../README.md)

***

[@tevm/primitives](../globals.md) / Log

# Interface: Log

Defined in: [ethereum-types/log.ts:18](https://github.com/evmts/primitives/blob/main/src/ethereum-types/log.ts#L18)

Event log entry

Logs are created by smart contracts during transaction execution.
They contain indexed topics for efficient filtering and non-indexed data.

## Properties

### address

> **address**: `` `0x${string}` ``

Defined in: [ethereum-types/log.ts:41](https://github.com/evmts/primitives/blob/main/src/ethereum-types/log.ts#L41)

Address of the contract that emitted this log

***

### blockHash?

> `optional` **blockHash**: `` `0x${string}` ``

Defined in: [ethereum-types/log.ts:32](https://github.com/evmts/primitives/blob/main/src/ethereum-types/log.ts#L32)

Hash of the block containing this log

***

### blockNumber?

> `optional` **blockNumber**: `` `0x${string}` ``

Defined in: [ethereum-types/log.ts:35](https://github.com/evmts/primitives/blob/main/src/ethereum-types/log.ts#L35)

Number of the block containing this log

***

### blockTimestamp?

> `optional` **blockTimestamp**: `` `0x${string}` ``

Defined in: [ethereum-types/log.ts:38](https://github.com/evmts/primitives/blob/main/src/ethereum-types/log.ts#L38)

Timestamp of the block containing this log

***

### data

> **data**: `` `0x${string}` ``

Defined in: [ethereum-types/log.ts:44](https://github.com/evmts/primitives/blob/main/src/ethereum-types/log.ts#L44)

Non-indexed data of the log

***

### logIndex?

> `optional` **logIndex**: `` `0x${string}` ``

Defined in: [ethereum-types/log.ts:23](https://github.com/evmts/primitives/blob/main/src/ethereum-types/log.ts#L23)

Index of the log in the block

***

### removed?

> `optional` **removed**: `boolean`

Defined in: [ethereum-types/log.ts:20](https://github.com/evmts/primitives/blob/main/src/ethereum-types/log.ts#L20)

Whether the log was removed due to a chain reorganization

***

### topics

> **topics**: readonly `` `0x${string}` ``[]

Defined in: [ethereum-types/log.ts:47](https://github.com/evmts/primitives/blob/main/src/ethereum-types/log.ts#L47)

Array of 0 to 4 indexed log arguments (topics)

***

### transactionHash?

> `optional` **transactionHash**: `` `0x${string}` ``

Defined in: [ethereum-types/log.ts:29](https://github.com/evmts/primitives/blob/main/src/ethereum-types/log.ts#L29)

Hash of the transaction that created this log

***

### transactionIndex?

> `optional` **transactionIndex**: `` `0x${string}` ``

Defined in: [ethereum-types/log.ts:26](https://github.com/evmts/primitives/blob/main/src/ethereum-types/log.ts#L26)

Index of the transaction that created this log
