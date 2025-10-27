[**@tevm/primitives**](../README.md)

***

[@tevm/primitives](../globals.md) / Filter

# Interface: Filter

Defined in: [ethereum-types/filter.ts:40](https://github.com/evmts/primitives/blob/main/src/ethereum-types/filter.ts#L40)

Log filter parameters

Used to filter logs by block range, contract address, and event topics

## Properties

### address?

> `optional` **address**: `` `0x${string}` `` \| readonly `` `0x${string}` ``[] \| `null`

Defined in: [ethereum-types/filter.ts:48](https://github.com/evmts/primitives/blob/main/src/ethereum-types/filter.ts#L48)

Contract address or array of addresses to filter logs from

***

### blockHash?

> `optional` **blockHash**: `` `0x${string}` ``

Defined in: [ethereum-types/filter.ts:54](https://github.com/evmts/primitives/blob/main/src/ethereum-types/filter.ts#L54)

Block hash to filter logs from (alternative to fromBlock/toBlock range)

***

### fromBlock?

> `optional` **fromBlock**: `` `0x${string}` `` \| [`BlockTag`](../type-aliases/BlockTag.md)

Defined in: [ethereum-types/filter.ts:42](https://github.com/evmts/primitives/blob/main/src/ethereum-types/filter.ts#L42)

Starting block (inclusive), defaults to "latest"

***

### toBlock?

> `optional` **toBlock**: `` `0x${string}` `` \| [`BlockTag`](../type-aliases/BlockTag.md)

Defined in: [ethereum-types/filter.ts:45](https://github.com/evmts/primitives/blob/main/src/ethereum-types/filter.ts#L45)

Ending block (inclusive), defaults to "latest"

***

### topics?

> `optional` **topics**: [`FilterTopics`](../type-aliases/FilterTopics.md)

Defined in: [ethereum-types/filter.ts:51](https://github.com/evmts/primitives/blob/main/src/ethereum-types/filter.ts#L51)

Array of topics to filter by
