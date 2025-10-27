[**@tevm/primitives**](../../../../README.md)

***

[@tevm/primitives](../../../../globals.md) / [wasm](../README.md) / Hash

# Class: Hash

Defined in: [crypto/keccak.wasm.ts:30](https://github.com/evmts/primitives/blob/main/src/crypto/keccak.wasm.ts#L30)

Keccak-256 hash (32 bytes)

## Methods

### equals()

> **equals**(`other`): `boolean`

Defined in: [crypto/keccak.wasm.ts:86](https://github.com/evmts/primitives/blob/main/src/crypto/keccak.wasm.ts#L86)

Compare with another hash for equality (constant-time)

#### Parameters

##### other

`Hash`

Hash to compare with

#### Returns

`boolean`

true if hashes are equal

***

### toBytes()

> **toBytes**(): `Uint8Array`

Defined in: [crypto/keccak.wasm.ts:94](https://github.com/evmts/primitives/blob/main/src/crypto/keccak.wasm.ts#L94)

Get raw bytes

#### Returns

`Uint8Array`

32-byte Uint8Array

***

### toHex()

> **toHex**(): `string`

Defined in: [crypto/keccak.wasm.ts:77](https://github.com/evmts/primitives/blob/main/src/crypto/keccak.wasm.ts#L77)

Convert hash to hex string (66 chars: "0x" + 64 hex)

#### Returns

`string`

Hex string with 0x prefix

***

### toString()

> **toString**(): `string`

Defined in: [crypto/keccak.wasm.ts:102](https://github.com/evmts/primitives/blob/main/src/crypto/keccak.wasm.ts#L102)

String representation (hex)

#### Returns

`string`

Hex string with 0x prefix

***

### fromBytes()

> `static` **fromBytes**(`bytes`): `Hash`

Defined in: [crypto/keccak.wasm.ts:69](https://github.com/evmts/primitives/blob/main/src/crypto/keccak.wasm.ts#L69)

Create hash from 32-byte buffer

#### Parameters

##### bytes

`Uint8Array`

32-byte buffer

#### Returns

`Hash`

Hash instance

***

### fromHex()

> `static` **fromHex**(`hex`): `Hash`

Defined in: [crypto/keccak.wasm.ts:59](https://github.com/evmts/primitives/blob/main/src/crypto/keccak.wasm.ts#L59)

Create hash from hex string

#### Parameters

##### hex

`string`

32-byte hex string (with or without 0x prefix)

#### Returns

`Hash`

Hash instance

***

### keccak256()

> `static` **keccak256**(`data`): `Hash`

Defined in: [crypto/keccak.wasm.ts:45](https://github.com/evmts/primitives/blob/main/src/crypto/keccak.wasm.ts#L45)

Compute Keccak-256 hash of input data

#### Parameters

##### data

Input data (string, Uint8Array, or Buffer)

`string` | `Uint8Array`\<`ArrayBufferLike`\>

#### Returns

`Hash`

Hash instance
