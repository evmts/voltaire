[**@tevm/primitives**](../../../../README.md)

***

[@tevm/primitives](../../../../globals.md) / [precompiles](../README.md) / execute

# Function: execute()

> **execute**(`address`, `input`, `gasLimit`, `_hardfork`): [`PrecompileResult`](../interfaces/PrecompileResult.md)

Defined in: [precompiles/precompiles.ts:116](https://github.com/evmts/primitives/blob/main/src/precompiles/precompiles.ts#L116)

Execute a precompile

## Parameters

### address

`string`

Precompile address

### input

`Uint8Array`

Input data

### gasLimit

`bigint`

Gas limit for execution

### \_hardfork

`Hardfork`

## Returns

[`PrecompileResult`](../interfaces/PrecompileResult.md)

Precompile execution result
