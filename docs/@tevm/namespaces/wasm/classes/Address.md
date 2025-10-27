[**@tevm/primitives**](../../../../README.md)

***

[@tevm/primitives](../../../../globals.md) / [wasm](../README.md) / Address

# Class: Address

Defined in: [primitives/address.wasm.ts:12](https://github.com/evmts/primitives/blob/main/src/primitives/address.wasm.ts#L12)

Ethereum address (20 bytes)
Implemented using WASM Zig code

## Methods

### equals()

> **equals**(`other`): `boolean`

Defined in: [primitives/address.wasm.ts:70](https://github.com/evmts/primitives/blob/main/src/primitives/address.wasm.ts#L70)

Compare with another address for equality

#### Parameters

##### other

`Address`

Address to compare with

#### Returns

`boolean`

true if addresses are equal

***

### isZero()

> **isZero**(): `boolean`

Defined in: [primitives/address.wasm.ts:61](https://github.com/evmts/primitives/blob/main/src/primitives/address.wasm.ts#L61)

Check if this is the zero address (0x0000...0000)

#### Returns

`boolean`

true if zero address

***

### toBytes()

> **toBytes**(): `Uint8Array`

Defined in: [primitives/address.wasm.ts:114](https://github.com/evmts/primitives/blob/main/src/primitives/address.wasm.ts#L114)

Get raw bytes

#### Returns

`Uint8Array`

20-byte Uint8Array

***

### toChecksumHex()

> **toChecksumHex**(): `string`

Defined in: [primitives/address.wasm.ts:53](https://github.com/evmts/primitives/blob/main/src/primitives/address.wasm.ts#L53)

Convert address to EIP-55 checksummed hex string

#### Returns

`string`

Mixed-case checksummed hex string

***

### toHex()

> **toHex**(): `string`

Defined in: [primitives/address.wasm.ts:45](https://github.com/evmts/primitives/blob/main/src/primitives/address.wasm.ts#L45)

Convert address to hex string (42 chars: "0x" + 40 hex)

#### Returns

`string`

Lowercase hex string with 0x prefix

***

### toString()

> **toString**(): `string`

Defined in: [primitives/address.wasm.ts:122](https://github.com/evmts/primitives/blob/main/src/primitives/address.wasm.ts#L122)

String representation (checksummed hex)

#### Returns

`string`

Checksummed hex string

***

### calculateCreate2Address()

> `static` **calculateCreate2Address**(`sender`, `salt`, `initCode`): `Address`

Defined in: [primitives/address.wasm.ts:101](https://github.com/evmts/primitives/blob/main/src/primitives/address.wasm.ts#L101)

Calculate CREATE2 contract address

#### Parameters

##### sender

`Address`

Deployer address

##### salt

`Uint8Array`

32-byte salt

##### initCode

`Uint8Array`

Contract initialization code

#### Returns

`Address`

Computed contract address

***

### calculateCreateAddress()

> `static` **calculateCreateAddress**(`sender`, `nonce`): `Address`

Defined in: [primitives/address.wasm.ts:89](https://github.com/evmts/primitives/blob/main/src/primitives/address.wasm.ts#L89)

Calculate CREATE contract address (from sender and nonce)

#### Parameters

##### sender

`Address`

Deployer address

##### nonce

`number`

Account nonce

#### Returns

`Address`

Computed contract address

***

### fromBytes()

> `static` **fromBytes**(`bytes`): `Address`

Defined in: [primitives/address.wasm.ts:37](https://github.com/evmts/primitives/blob/main/src/primitives/address.wasm.ts#L37)

Create address from 20-byte buffer

#### Parameters

##### bytes

`Uint8Array`

20-byte buffer

#### Returns

`Address`

Address instance

***

### fromHex()

> `static` **fromHex**(`hex`): `Address`

Defined in: [primitives/address.wasm.ts:27](https://github.com/evmts/primitives/blob/main/src/primitives/address.wasm.ts#L27)

Create address from hex string (with or without 0x prefix)

#### Parameters

##### hex

`string`

Hex string representation

#### Returns

`Address`

Address instance

***

### validateChecksum()

> `static` **validateChecksum**(`hex`): `boolean`

Defined in: [primitives/address.wasm.ts:79](https://github.com/evmts/primitives/blob/main/src/primitives/address.wasm.ts#L79)

Validate EIP-55 checksum of a hex string

#### Parameters

##### hex

`string`

Hex string to validate

#### Returns

`boolean`

true if checksum is valid
