[**@tevm/primitives**](../../../../README.md)

***

[@tevm/primitives](../../../../globals.md) / [wasm](../README.md) / eip191HashMessage

# Function: eip191HashMessage()

> **eip191HashMessage**(`message`): [`Hash`](../classes/Hash.md)

Defined in: [crypto/keccak.wasm.ts:138](https://github.com/evmts/primitives/blob/main/src/crypto/keccak.wasm.ts#L138)

Compute EIP-191 personal message hash
Prepends "\x19Ethereum Signed Message:\n{length}" to message

## Parameters

### message

Message to hash

`string` | `Uint8Array`\<`ArrayBufferLike`\>

## Returns

[`Hash`](../classes/Hash.md)

Hash of formatted message
