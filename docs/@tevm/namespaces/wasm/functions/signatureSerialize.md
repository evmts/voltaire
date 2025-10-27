[**@tevm/primitives**](../../../../README.md)

***

[@tevm/primitives](../../../../globals.md) / [wasm](../README.md) / signatureSerialize

# Function: signatureSerialize()

> **signatureSerialize**(`r`, `s`, `v`, `includeV`): `Uint8Array`

Defined in: [crypto/signature.wasm.ts:183](https://github.com/evmts/primitives/blob/main/src/crypto/signature.wasm.ts#L183)

Serialize signature components to compact format

## Parameters

### r

`Uint8Array`

R component of signature (32 bytes)

### s

`Uint8Array`

S component of signature (32 bytes)

### v

`number`

Recovery parameter

### includeV

`boolean` = `true`

Whether to include v byte (65 bytes) or not (64 bytes)

## Returns

`Uint8Array`

Serialized signature
