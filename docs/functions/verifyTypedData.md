[**@tevm/primitives**](../README.md)

***

[@tevm/primitives](../globals.md) / verifyTypedData

# Function: verifyTypedData()

> **verifyTypedData**(`_typedData`, `_signature`, `_address`): `boolean`

Defined in: [crypto/eip712.ts:267](https://github.com/evmts/primitives/blob/main/src/crypto/eip712.ts#L267)

Verify typed data signature
NOTE: This is a stub implementation that requires proper signature recovery
to be exposed via the C API. For now, it throws an error.

## Parameters

### \_typedData

[`TypedData`](../interfaces/TypedData.md)

### \_signature

`` `0x${string}` `` | [`Eip712Signature`](../type-aliases/Eip712Signature.md)

### \_address

`` `0x${string}` ``

## Returns

`boolean`

true if signature is valid
