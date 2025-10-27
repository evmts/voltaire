[**@tevm/primitives**](../../../../README.md)

***

[@tevm/primitives](../../../../globals.md) / [wasm](../README.md) / signatureNormalize

# Function: signatureNormalize()

> **signatureNormalize**(`r`, `s`): \[`Uint8Array`\<`ArrayBufferLike`\>, `Uint8Array`\<`ArrayBufferLike`\>\]

Defined in: [crypto/signature.wasm.ts:123](https://github.com/evmts/primitives/blob/main/src/crypto/signature.wasm.ts#L123)

Normalize signature to low-S form (EIP-2)
Modifies signature components to ensure s is in the lower half of the curve order

## Parameters

### r

`Uint8Array`

R component of signature (32 bytes)

### s

`Uint8Array`

S component of signature (32 bytes)

## Returns

\[`Uint8Array`\<`ArrayBufferLike`\>, `Uint8Array`\<`ArrayBufferLike`\>\]

Normalized [r, s] components
