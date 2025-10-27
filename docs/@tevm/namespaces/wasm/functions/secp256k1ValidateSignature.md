[**@tevm/primitives**](../../../../README.md)

***

[@tevm/primitives](../../../../globals.md) / [wasm](../README.md) / secp256k1ValidateSignature

# Function: secp256k1ValidateSignature()

> **secp256k1ValidateSignature**(`r`, `s`): `boolean`

Defined in: [crypto/signature.wasm.ts:102](https://github.com/evmts/primitives/blob/main/src/crypto/signature.wasm.ts#L102)

Validate ECDSA signature components (r, s)

## Parameters

### r

`Uint8Array`

R component of signature (32 bytes)

### s

`Uint8Array`

S component of signature (32 bytes)

## Returns

`boolean`

true if signature is valid
