[**@tevm/primitives**](../../../../README.md)

***

[@tevm/primitives](../../../../globals.md) / [wasm](../README.md) / signatureIsCanonical

# Function: signatureIsCanonical()

> **signatureIsCanonical**(`r`, `s`): `boolean`

Defined in: [crypto/signature.wasm.ts:144](https://github.com/evmts/primitives/blob/main/src/crypto/signature.wasm.ts#L144)

Check if signature is in canonical form (low-S)

## Parameters

### r

`Uint8Array`

R component of signature (32 bytes)

### s

`Uint8Array`

S component of signature (32 bytes)

## Returns

`boolean`

true if signature is canonical
