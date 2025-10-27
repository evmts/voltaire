[**@tevm/primitives**](../../../../README.md)

***

[@tevm/primitives](../../../../globals.md) / [wasm](../README.md) / isValidJumpDest

# Function: isValidJumpDest()

> **isValidJumpDest**(`code`, `position`): `boolean`

Defined in: [primitives/bytecode.wasm.ts:53](https://github.com/evmts/primitives/blob/main/src/primitives/bytecode.wasm.ts#L53)

Check if a position is a valid JUMPDEST

## Parameters

### code

`Uint8Array`

EVM bytecode

### position

`number`

Position to check

## Returns

`boolean`

true if position contains a valid JUMPDEST opcode
