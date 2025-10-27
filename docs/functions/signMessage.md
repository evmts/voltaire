[**@tevm/primitives**](../README.md)

***

[@tevm/primitives](../globals.md) / signMessage

# Function: signMessage()

> **signMessage**(`_message`, `_privateKey`): [`Eip191Signature`](../type-aliases/Eip191Signature.md)

Defined in: [crypto/eip191.ts:87](https://github.com/evmts/primitives/blob/main/src/crypto/eip191.ts#L87)

Sign a message using EIP-191 personal message format
NOTE: This is a stub implementation that requires proper secp256k1 signing
to be exposed via the C API. For now, it throws an error.

## Parameters

### \_message

`string` | `Uint8Array`\<`ArrayBufferLike`\>

### \_privateKey

`` `0x${string}` ``

## Returns

[`Eip191Signature`](../type-aliases/Eip191Signature.md)

Signature object with r, s, v components
