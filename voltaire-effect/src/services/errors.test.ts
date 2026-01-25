/**
 * @fileoverview Tests for standardized error shapes across voltaire-effect services.
 * 
 * All service errors should have a consistent interface:
 * - _tag: discriminant for Effect error handling
 * - input: the original input that caused the error
 * - message: human-readable error message
 * - cause: optional underlying error
 */
import { describe, expect, it } from 'vitest'
import { TransportError } from './Transport/TransportError.js'
import { PublicClientError } from './PublicClient/PublicClientService.js'
import { AccountError } from './Account/AccountService.js'
import { WalletClientError } from './WalletClient/WalletClientService.js'
import {
  ContractError,
  ContractCallError,
  ContractWriteError,
  ContractEventError,
} from './Contract/ContractTypes.js'

describe('Error constructor standardization', () => {
  describe('All errors have consistent shape', () => {
    it('TransportError has _tag, input, message, cause', () => {
      const input = { code: -32603, message: 'Internal error', data: { extra: 'info' } }
      const cause = new Error('underlying')
      const error = new TransportError(input, 'Transport failed', { cause })

      expect(error._tag).toBe('TransportError')
      expect(error.name).toBe('TransportError')
      expect(error.input).toEqual(input)
      expect(error.message).toBe('Transport failed')
      expect(error.cause).toBe(cause)
    })

    it('TransportError preserves code and data from input', () => {
      const input = { code: -32601, message: 'Method not found', data: '0x1234' }
      const error = new TransportError(input, 'RPC error')

      expect(error.code).toBe(-32601)
      expect(error.data).toBe('0x1234')
    })

    it('PublicClientError has _tag, input, message, cause', () => {
      const input = { method: 'eth_getBalance', params: ['0x123'] }
      const cause = new Error('network timeout')
      const error = new PublicClientError(input, 'Failed to get balance', { cause })

      expect(error._tag).toBe('PublicClientError')
      expect(error.name).toBe('PublicClientError')
      expect(error.input).toEqual(input)
      expect(error.message).toBe('Failed to get balance')
      expect(error.cause).toBe(cause)
    })

    it('AccountError has _tag, input, message, cause', () => {
      const input = { message: '0x1234abcd' }
      const cause = new Error('signing failed')
      const error = new AccountError(input, 'Failed to sign message', { cause })

      expect(error._tag).toBe('AccountError')
      expect(error.name).toBe('AccountError')
      expect(error.input).toEqual(input)
      expect(error.message).toBe('Failed to sign message')
      expect(error.cause).toBe(cause)
    })

    it('WalletClientError has _tag, input, message, cause', () => {
      const input = { to: '0x123', value: 1000n }
      const cause = new Error('insufficient funds')
      const error = new WalletClientError(input, 'Transaction failed', { cause })

      expect(error._tag).toBe('WalletClientError')
      expect(error.name).toBe('WalletClientError')
      expect(error.input).toEqual(input)
      expect(error.message).toBe('Transaction failed')
      expect(error.cause).toBe(cause)
    })

    it('ContractError has _tag, input, message, cause', () => {
      const input = { address: '0x123', method: 'transfer' }
      const cause = new Error('execution reverted')
      const error = new ContractError(input, 'Contract call failed', { cause })

      expect(error._tag).toBe('ContractError')
      expect(error.name).toBe('ContractError')
      expect(error.input).toEqual(input)
      expect(error.message).toBe('Contract call failed')
      expect(error.cause).toBe(cause)
    })

    it('ContractCallError has _tag, input, message, cause', () => {
      const input = { address: '0x123', method: 'balanceOf', args: ['0x456'] }
      const cause = new Error('view failed')
      const error = new ContractCallError(input, 'Read failed', { cause })

      expect(error._tag).toBe('ContractCallError')
      expect(error.name).toBe('ContractCallError')
      expect(error.input).toEqual(input)
      expect(error.message).toBe('Read failed')
      expect(error.cause).toBe(cause)
    })

    it('ContractWriteError has _tag, input, message, cause', () => {
      const input = { address: '0x123', method: 'transfer', args: ['0x456', 100n] }
      const cause = new Error('gas estimation failed')
      const error = new ContractWriteError(input, 'Write failed', { cause })

      expect(error._tag).toBe('ContractWriteError')
      expect(error.name).toBe('ContractWriteError')
      expect(error.input).toEqual(input)
      expect(error.message).toBe('Write failed')
      expect(error.cause).toBe(cause)
    })

    it('ContractEventError has _tag, input, message, cause', () => {
      const input = { address: '0x123', event: 'Transfer', fromBlock: 1000n }
      const cause = new Error('getLogs failed')
      const error = new ContractEventError(input, 'Event query failed', { cause })

      expect(error._tag).toBe('ContractEventError')
      expect(error.name).toBe('ContractEventError')
      expect(error.input).toEqual(input)
      expect(error.message).toBe('Event query failed')
      expect(error.cause).toBe(cause)
    })
  })

  describe('Error without cause', () => {
    it('TransportError works without cause', () => {
      const input = { code: -32600, message: 'Invalid request' }
      const error = new TransportError(input, 'Bad request')

      expect(error.input).toEqual(input)
      expect(error.message).toBe('Bad request')
      expect(error.cause).toBeUndefined()
    })

    it('PublicClientError works without cause', () => {
      const error = new PublicClientError('0xhash', 'Transaction timeout')

      expect(error.input).toBe('0xhash')
      expect(error.message).toBe('Transaction timeout')
      expect(error.cause).toBeUndefined()
    })

    it('AccountError works without cause', () => {
      const error = new AccountError({ action: 'signMessage' }, 'Signing rejected')

      expect(error.input).toEqual({ action: 'signMessage' })
      expect(error.message).toBe('Signing rejected')
      expect(error.cause).toBeUndefined()
    })

    it('WalletClientError works without cause', () => {
      const error = new WalletClientError({ action: 'sendTransaction' }, 'User rejected')

      expect(error.input).toEqual({ action: 'sendTransaction' })
      expect(error.message).toBe('User rejected')
      expect(error.cause).toBeUndefined()
    })
  })

  describe('Error instanceof checks', () => {
    it('all errors extend Error', () => {
      expect(new TransportError({ code: 1, message: 'x' }, 'x')).toBeInstanceOf(Error)
      expect(new PublicClientError({}, 'x')).toBeInstanceOf(Error)
      expect(new AccountError({}, 'x')).toBeInstanceOf(Error)
      expect(new WalletClientError({}, 'x')).toBeInstanceOf(Error)
      expect(new ContractError({}, 'x')).toBeInstanceOf(Error)
      expect(new ContractCallError({}, 'x')).toBeInstanceOf(Error)
      expect(new ContractWriteError({}, 'x')).toBeInstanceOf(Error)
      expect(new ContractEventError({}, 'x')).toBeInstanceOf(Error)
    })

    it('contract sub-errors extend ContractError', () => {
      expect(new ContractCallError({}, 'x')).toBeInstanceOf(ContractError)
      expect(new ContractWriteError({}, 'x')).toBeInstanceOf(ContractError)
      expect(new ContractEventError({}, 'x')).toBeInstanceOf(ContractError)
    })
  })

  describe('Error message defaults', () => {
    it('TransportError uses input.message as fallback', () => {
      const input = { code: -32603, message: 'Internal error' }
      const error = new TransportError(input)

      expect(error.message).toBe('Internal error')
    })

    it('errors can derive message from cause', () => {
      const cause = new Error('Original error')
      const error = new PublicClientError({ method: 'eth_call' }, undefined, { cause })

      expect(error.message).toBe('Original error')
    })
  })
})
