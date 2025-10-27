[**@tevm/primitives**](../README.md)

***

[@tevm/primitives](../globals.md) / hashMessage

# Function: hashMessage()

> **hashMessage**(`message`): `` `0x${string}` ``

Defined in: [crypto/eip191.ts:42](https://github.com/evmts/primitives/blob/main/src/crypto/eip191.ts#L42)

Hash a message using EIP-191 personal message format
Format: "\x19Ethereum Signed Message:\n" + len(message) + message

## Parameters

### message

Message to hash (string or Uint8Array)

`string` | `Uint8Array`\<`ArrayBufferLike`\>

## Returns

`` `0x${string}` ``

32-byte hash as hex string with 0x prefix
