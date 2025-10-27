[**@tevm/primitives**](../README.md)

***

[@tevm/primitives](../globals.md) / recoverMessageAddress

# Function: recoverMessageAddress()

> **recoverMessageAddress**(`_message`, `_signature`): `` `0x${string}` ``

Defined in: [crypto/eip191.ts:123](https://github.com/evmts/primitives/blob/main/src/crypto/eip191.ts#L123)

Recover the address that signed a message
NOTE: This is a stub implementation that requires proper signature recovery
to be exposed via the C API. For now, it throws an error.

## Parameters

### \_message

`string` | `Uint8Array`\<`ArrayBufferLike`\>

### \_signature

`` `0x${string}` `` | [`Eip191Signature`](../type-aliases/Eip191Signature.md)

## Returns

`` `0x${string}` ``

Recovered Ethereum address
