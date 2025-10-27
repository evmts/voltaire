[**@tevm/primitives**](../../../../README.md)

***

[@tevm/primitives](../../../../globals.md) / [wasm](../README.md) / secp256k1PubkeyFromPrivate

# Function: secp256k1PubkeyFromPrivate()

> **secp256k1PubkeyFromPrivate**(`privateKey`): `Uint8Array`

Defined in: [crypto/signature.wasm.ts:87](https://github.com/evmts/primitives/blob/main/src/crypto/signature.wasm.ts#L87)

Derive public key from private key using secp256k1

## Parameters

### privateKey

`Uint8Array`

32-byte private key

## Returns

`Uint8Array`

Uncompressed public key (64 bytes)
