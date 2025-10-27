[**@tevm/primitives**](../README.md)

***

[@tevm/primitives](../globals.md) / DecodedLog

# Interface: DecodedLog\<T\>

Defined in: [ethereum-types/log.ts:53](https://github.com/evmts/primitives/blob/main/src/ethereum-types/log.ts#L53)

Decoded log with event name and parameters

## Type Parameters

### T

`T` = `Record`\<`string`, `unknown`\>

## Properties

### address

> **address**: `` `0x${string}` ``

Defined in: [ethereum-types/log.ts:58](https://github.com/evmts/primitives/blob/main/src/ethereum-types/log.ts#L58)

Contract address that emitted the log

***

### args

> **args**: `T`

Defined in: [ethereum-types/log.ts:61](https://github.com/evmts/primitives/blob/main/src/ethereum-types/log.ts#L61)

Decoded event arguments

***

### eventName

> **eventName**: `string`

Defined in: [ethereum-types/log.ts:55](https://github.com/evmts/primitives/blob/main/src/ethereum-types/log.ts#L55)

Name of the event

***

### log

> **log**: [`Log`](Log.md)

Defined in: [ethereum-types/log.ts:64](https://github.com/evmts/primitives/blob/main/src/ethereum-types/log.ts#L64)

Original log
