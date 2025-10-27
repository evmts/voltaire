[**@tevm/primitives**](../../../../README.md)

***

[@tevm/primitives](../../../../globals.md) / [wasm](../README.md) / compressPublicKey

# Function: compressPublicKey()

> **compressPublicKey**(`uncompressed`): `Uint8Array`

Defined in: [crypto/wallet.wasm.ts:21](https://github.com/evmts/primitives/blob/main/src/crypto/wallet.wasm.ts#L21)

Compress uncompressed secp256k1 public key

## Parameters

### uncompressed

`Uint8Array`

64-byte uncompressed public key (x, y coordinates)

## Returns

`Uint8Array`

33-byte compressed public key (0x02/0x03 prefix + x coordinate)
