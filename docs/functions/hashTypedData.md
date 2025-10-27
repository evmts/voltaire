[**@tevm/primitives**](../README.md)

***

[@tevm/primitives](../globals.md) / hashTypedData

# Function: hashTypedData()

> **hashTypedData**(`typedData`): `` `0x${string}` ``

Defined in: [crypto/eip712.ts:226](https://github.com/evmts/primitives/blob/main/src/crypto/eip712.ts#L226)

Hash typed data according to EIP-712
Format: keccak256("\x19\x01" ‖ domainSeparator ‖ hashStruct(message))

## Parameters

### typedData

[`TypedData`](../interfaces/TypedData.md)

Typed data object

## Returns

`` `0x${string}` ``

32-byte hash as hex string with 0x prefix
