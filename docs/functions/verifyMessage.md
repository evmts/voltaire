[**@tevm/primitives**](../README.md)

***

[@tevm/primitives](../globals.md) / verifyMessage

# Function: verifyMessage()

> **verifyMessage**(`_message`, `_signature`, `_address`): `boolean`

Defined in: [crypto/eip191.ts:105](https://github.com/evmts/primitives/blob/main/src/crypto/eip191.ts#L105)

Verify a signature against a message and address
NOTE: This is a stub implementation that requires proper signature recovery
to be exposed via the C API. For now, it throws an error.

## Parameters

### \_message

`string` | `Uint8Array`\<`ArrayBufferLike`\>

### \_signature

`` `0x${string}` `` | [`Eip191Signature`](../type-aliases/Eip191Signature.md)

### \_address

`` `0x${string}` ``

## Returns

`boolean`

true if signature is valid, false otherwise
