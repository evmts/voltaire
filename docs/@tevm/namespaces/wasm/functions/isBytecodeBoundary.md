[**@tevm/primitives**](../../../../README.md)

***

[@tevm/primitives](../../../../globals.md) / [wasm](../README.md) / isBytecodeBoundary

# Function: isBytecodeBoundary()

> **isBytecodeBoundary**(`code`, `position`): `boolean`

Defined in: [primitives/bytecode.wasm.ts:39](https://github.com/evmts/primitives/blob/main/src/primitives/bytecode.wasm.ts#L39)

Check if a position is at a bytecode boundary (not inside PUSH data)

## Parameters

### code

`Uint8Array`

EVM bytecode

### position

`number`

Position to check

## Returns

`boolean`

true if position is a valid instruction boundary
