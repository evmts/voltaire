[**@tevm/primitives**](../../../../README.md)

***

[@tevm/primitives](../../../../globals.md) / [wasm](../README.md) / secp256k1RecoverAddress

# Function: secp256k1RecoverAddress()

> **secp256k1RecoverAddress**(`messageHash`, `r`, `s`, `v`): `Uint8Array`

Defined in: [crypto/signature.wasm.ts:59](https://github.com/evmts/primitives/blob/main/src/crypto/signature.wasm.ts#L59)

Recover Ethereum address from ECDSA signature

## Parameters

### messageHash

`Uint8Array`

32-byte message hash

### r

`Uint8Array`

R component of signature (32 bytes)

### s

`Uint8Array`

S component of signature (32 bytes)

### v

`number`

Recovery parameter (0-3)

## Returns

`Uint8Array`

Ethereum address (20 bytes)
