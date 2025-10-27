[**@tevm/primitives**](../../../../README.md)

***

[@tevm/primitives](../../../../globals.md) / [wasm](../README.md) / analyzeJumpDestinations

# Function: analyzeJumpDestinations()

> **analyzeJumpDestinations**(`code`): [`JumpDestination`](../interfaces/JumpDestination.md)[]

Defined in: [primitives/bytecode.wasm.ts:23](https://github.com/evmts/primitives/blob/main/src/primitives/bytecode.wasm.ts#L23)

Analyze bytecode to find all valid JUMPDEST locations

## Parameters

### code

`Uint8Array`

EVM bytecode

## Returns

[`JumpDestination`](../interfaces/JumpDestination.md)[]

Array of JUMPDEST positions
