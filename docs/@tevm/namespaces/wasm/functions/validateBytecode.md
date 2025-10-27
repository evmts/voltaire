[**@tevm/primitives**](../../../../README.md)

***

[@tevm/primitives](../../../../globals.md) / [wasm](../README.md) / validateBytecode

# Function: validateBytecode()

> **validateBytecode**(`code`): `void`

Defined in: [primitives/bytecode.wasm.ts:64](https://github.com/evmts/primitives/blob/main/src/primitives/bytecode.wasm.ts#L64)

Validate bytecode for basic correctness
Checks that PUSH instructions have enough data bytes

## Parameters

### code

`Uint8Array`

EVM bytecode

## Returns

`void`

## Throws

Error if bytecode is invalid
