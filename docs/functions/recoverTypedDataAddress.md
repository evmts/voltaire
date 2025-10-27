[**@tevm/primitives**](../README.md)

***

[@tevm/primitives](../globals.md) / recoverTypedDataAddress

# Function: recoverTypedDataAddress()

> **recoverTypedDataAddress**(`_typedData`, `_signature`): `` `0x${string}` ``

Defined in: [crypto/eip712.ts:285](https://github.com/evmts/primitives/blob/main/src/crypto/eip712.ts#L285)

Recover address from typed data signature
NOTE: This is a stub implementation that requires proper signature recovery
to be exposed via the C API. For now, it throws an error.

## Parameters

### \_typedData

[`TypedData`](../interfaces/TypedData.md)

### \_signature

`` `0x${string}` `` | [`Eip712Signature`](../type-aliases/Eip712Signature.md)

## Returns

`` `0x${string}` ``

Recovered Ethereum address
