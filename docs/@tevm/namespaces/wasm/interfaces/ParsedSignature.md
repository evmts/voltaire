[**@tevm/primitives**](../../../../README.md)

***

[@tevm/primitives](../../../../globals.md) / [wasm](../README.md) / ParsedSignature

# Interface: ParsedSignature

Defined in: [crypto/signature.wasm.ts:11](https://github.com/evmts/primitives/blob/main/src/crypto/signature.wasm.ts#L11)

Parsed ECDSA signature components

## Properties

### r

> **r**: `Uint8Array`

Defined in: [crypto/signature.wasm.ts:13](https://github.com/evmts/primitives/blob/main/src/crypto/signature.wasm.ts#L13)

R component (32 bytes)

***

### s

> **s**: `Uint8Array`

Defined in: [crypto/signature.wasm.ts:15](https://github.com/evmts/primitives/blob/main/src/crypto/signature.wasm.ts#L15)

S component (32 bytes)

***

### v

> **v**: `number`

Defined in: [crypto/signature.wasm.ts:17](https://github.com/evmts/primitives/blob/main/src/crypto/signature.wasm.ts#L17)

V recovery parameter (1 byte)
