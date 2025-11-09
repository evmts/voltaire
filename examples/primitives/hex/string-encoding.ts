/**
 * String Encoding Example
 *
 * Demonstrates:
 * - UTF-8 string encoding to hex
 * - Hex decoding to UTF-8 strings
 * - Working with emoji and multi-byte characters
 * - Round-trip conversions
 * - Common string encoding patterns
 */

import { Hex } from '@tevm/voltaire'

console.log('=== String Encoding ===\n')

// 1. Basic string encoding
console.log('1. Basic string encoding:')

const text1 = 'hello'
const hex1 = Hex.fromString(text1)
console.log(`  "${text1}" → ${hex1}`)

// Decode back
const decoded1 = Hex.toString(hex1)
console.log(`  ${hex1} → "${decoded1}"`)
console.log(`  Round-trip match: ${text1 === decoded1}`)

// Empty string
const empty = ''
const hexEmpty = Hex.fromString(empty)
console.log(`  Empty string → ${hexEmpty}`)

// 2. Multi-word strings
console.log('\n2. Multi-word strings:')

const text2 = 'Hello, Ethereum!'
const hex2 = Hex.fromString(text2)
console.log(`  "${text2}"`)
console.log(`  Encoded: ${hex2}`)
console.log(`  Size: ${Hex.size(hex2)} bytes`)

// Decode
const decoded2 = Hex.toString(hex2)
console.log(`  Decoded: "${decoded2}"`)

// 3. Emoji and special characters
console.log('\n3. Emoji and special characters:')

const emojis = [
  '🔥',
  '🚀',
  '💎',
  '🌊',
  '⚡',
]

emojis.forEach(emoji => {
  const hex = Hex.fromString(emoji)
  const decoded = Hex.toString(hex)
  console.log(`  ${emoji} → ${hex} (${Hex.size(hex)} bytes) → ${decoded}`)
})

// Multiple emojis
const multiEmoji = '🔥🚀💎'
const hexMulti = Hex.fromString(multiEmoji)
console.log(`  "${multiEmoji}" → ${hexMulti} (${Hex.size(hexMulti)} bytes)`)

// 4. Different languages
console.log('\n4. Different languages (UTF-8):')

const languages = [
  { lang: 'English', text: 'Hello' },
  { lang: 'Spanish', text: 'Hola' },
  { lang: 'Japanese', text: 'こんにちは' },
  { lang: 'Russian', text: 'Привет' },
  { lang: 'Arabic', text: 'مرحبا' },
  { lang: 'Chinese', text: '你好' },
]

languages.forEach(({ lang, text }) => {
  const hex = Hex.fromString(text)
  const decoded = Hex.toString(hex)
  console.log(`  ${lang}: "${text}" → ${hex.slice(0, 20)}... (${Hex.size(hex)} bytes)`)
  console.log(`    Round-trip: ${text === decoded ? '✓' : '✗'}`)
})

// 5. Smart contract strings
console.log('\n5. Smart contract strings:')

// Token name
const tokenName = 'MyToken'
const nameHex = Hex.fromString(tokenName)
console.log(`  Token name: "${tokenName}"`)
console.log(`  Encoded: ${nameHex}`)

// Token symbol
const symbol = 'MTK'
const symbolHex = Hex.fromString(symbol)
console.log(`  Symbol: "${symbol}"`)
console.log(`  Encoded: ${symbolHex}`)

// URI/URL
const uri = 'https://example.com/metadata/1'
const uriHex = Hex.fromString(uri)
console.log(`  URI: "${uri}"`)
console.log(`  Encoded: ${uriHex}`)
console.log(`  Size: ${Hex.size(uriHex)} bytes`)

// 6. Error messages
console.log('\n6. Error messages:')

const errorMessage = 'Insufficient balance'
const errorHex = Hex.fromString(errorMessage)
console.log(`  Error: "${errorMessage}"`)
console.log(`  Encoded: ${errorHex}`)

// Revert reason (typically starts with Error(string) selector)
const ERROR_SELECTOR = Hex('0x08c379a0') // Error(string)
const encodedError = Hex.concat(
  ERROR_SELECTOR,
  Hex.fromBigInt(32n, 32), // offset
  Hex.fromBigInt(BigInt(errorMessage.length), 32), // length
  Hex.padRight(errorHex, 32) // data (right-padded to 32 bytes)
)

console.log(`  Full revert data: ${encodedError}`)
console.log(`  Size: ${Hex.size(encodedError)} bytes`)

// 7. Function signatures
console.log('\n7. Function signatures:')

const signatures = [
  'transfer(address,uint256)',
  'approve(address,uint256)',
  'balanceOf(address)',
  'totalSupply()',
]

signatures.forEach(sig => {
  const hex = Hex.fromString(sig)
  console.log(`  "${sig}"`)
  console.log(`    Hex: ${hex}`)
  console.log(`    Size: ${Hex.size(hex)} bytes`)
  // In practice, you'd take keccak256(hex).slice(0, 4) for the selector
})

// 8. Event signatures
console.log('\n8. Event signatures:')

const eventSignatures = [
  'Transfer(address,address,uint256)',
  'Approval(address,address,uint256)',
  'Mint(address,uint256)',
  'Burn(address,uint256)',
]

eventSignatures.forEach(sig => {
  const hex = Hex.fromString(sig)
  console.log(`  "${sig}"`)
  console.log(`    Hex: ${hex}`)
  // In practice, you'd take keccak256(hex) for the topic
})

// 9. Padding strings for ABI encoding
console.log('\n9. Padding strings for ABI encoding:')

const message = 'Hello'
const messageHex = Hex.fromString(message)

// String ABI encoding: offset + length + data (right-padded)
const offset = Hex.fromBigInt(32n, 32)
const length = Hex.fromBigInt(BigInt(message.length), 32)
const paddedData = Hex.padRight(messageHex, 32)

const encoded = Hex.concat(offset, length, paddedData)

console.log(`  Message: "${message}"`)
console.log(`  Offset: ${offset}`)
console.log(`  Length: ${length}`)
console.log(`  Data: ${messageHex} → ${paddedData}`)
console.log(`  Full encoding: ${encoded}`)
console.log(`  Total size: ${Hex.size(encoded)} bytes`)

// Decode
const decodedLength = Hex.toNumber(Hex.slice(encoded, 32, 64))
const encodedData = Hex.slice(encoded, 64, 96)
const trimmedData = Hex.slice(encodedData, 0, decodedLength)
const decodedMessage = Hex.toString(trimmedData)

console.log(`  Decoded length: ${decodedLength}`)
console.log(`  Decoded message: "${decodedMessage}"`)
console.log(`  Match: ${message === decodedMessage}`)

// 10. Special characters and escape sequences
console.log('\n10. Special characters:')

const specialChars = [
  { name: 'Newline', char: '\n', desc: '\\n' },
  { name: 'Tab', char: '\t', desc: '\\t' },
  { name: 'Quote', char: '"', desc: '\\"' },
  { name: 'Backslash', char: '\\', desc: '\\\\' },
]

specialChars.forEach(({ name, char, desc }) => {
  const hex = Hex.fromString(char)
  const decoded = Hex.toString(hex)
  console.log(`  ${name} (${desc}): ${hex} → matches: ${char === decoded}`)
})

// 11. Long strings
console.log('\n11. Long strings:')

const longText = 'The quick brown fox jumps over the lazy dog. '.repeat(5)
const longHex = Hex.fromString(longText)
console.log(`  Original length: ${longText.length} characters`)
console.log(`  Hex size: ${Hex.size(longHex)} bytes`)
console.log(`  Preview: ${longHex.slice(0, 40)}...`)

// Verify round-trip
const decodedLong = Hex.toString(longHex)
console.log(`  Round-trip match: ${longText === decodedLong}`)

console.log('\n=== Example completed ===\n')
