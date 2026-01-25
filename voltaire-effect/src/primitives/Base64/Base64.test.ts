import { describe, it, expect } from 'vitest'
import * as Base64 from './index.js'
import * as Schema from 'effect/Schema'

describe('Base64 Schema', () => {
  it('decodes valid base64 string', () => {
    const input = 'SGVsbG8gV29ybGQ='
    const result = Schema.decodeSync(Base64.Schema)(input)
    expect(typeof result).toBe('string')
    expect(result).toBe(input)
  })

  it('decodes Uint8Array to base64', () => {
    const input = new Uint8Array([72, 101, 108, 108, 111])
    const result = Schema.decodeSync(Base64.Schema)(input)
    expect(typeof result).toBe('string')
  })

  it('rejects invalid base64', () => {
    expect(() => Schema.decodeSync(Base64.Schema)('not!valid@base64')).toThrow()
  })

  it('handles empty string', () => {
    const result = Schema.decodeSync(Base64.Schema)('')
    expect(result).toBe('')
  })

  it('handles padded base64', () => {
    const result = Schema.decodeSync(Base64.Schema)('YQ==')
    expect(result).toBe('YQ==')
  })
})

describe('Base64 UrlSchema', () => {
  it('decodes valid URL-safe base64 string', () => {
    const input = 'SGVsbG8tV29ybGQ_'
    const result = Schema.decodeSync(Base64.UrlSchema)(input)
    expect(typeof result).toBe('string')
  })

  it('decodes Uint8Array to URL-safe base64', () => {
    const input = new Uint8Array([72, 101, 108, 108, 111])
    const result = Schema.decodeSync(Base64.UrlSchema)(input)
    expect(typeof result).toBe('string')
  })

  it('handles standard chars in URL-safe', () => {
    const result = Schema.decodeSync(Base64.UrlSchema)('YWJjZGVm')
    expect(result).toBe('YWJjZGVm')
  })
})
