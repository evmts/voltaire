[**@tevm/primitives**](../README.md)

***

[@tevm/primitives](../globals.md) / signTypedData

# Function: signTypedData()

> **signTypedData**(`_typedData`, `_privateKey`): [`Eip712Signature`](../type-aliases/Eip712Signature.md)

Defined in: [crypto/eip712.ts:249](https://github.com/evmts/primitives/blob/main/src/crypto/eip712.ts#L249)

Sign typed data with a private key
NOTE: This is a stub implementation that requires proper secp256k1 signing
to be exposed via the C API. For now, it throws an error.

## Parameters

### \_typedData

[`TypedData`](../interfaces/TypedData.md)

### \_privateKey

`` `0x${string}` ``

## Returns

[`Eip712Signature`](../type-aliases/Eip712Signature.md)

Signature object
