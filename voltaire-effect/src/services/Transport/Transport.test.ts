import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as Effect from 'effect/Effect'
import { TransportService, TransportError, HttpTransport, TestTransport, BrowserTransport } from './index.js'

describe('TransportService', () => {
  describe('TestTransport', () => {
    it('returns mocked responses', async () => {
      const program = Effect.gen(function* () {
        const transport = yield* TransportService
        return yield* transport.request<string>('eth_blockNumber', [])
      }).pipe(Effect.provide(TestTransport({ eth_blockNumber: '0x1234' })))

      const result = await Effect.runPromise(program)
      expect(result).toBe('0x1234')
    })

    it('returns mocked responses from Map', async () => {
      const responses = new Map([['eth_chainId', '0x1']])
      const program = Effect.gen(function* () {
        const transport = yield* TransportService
        return yield* transport.request<string>('eth_chainId', [])
      }).pipe(Effect.provide(TestTransport(responses)))

      const result = await Effect.runPromise(program)
      expect(result).toBe('0x1')
    })

    it('fails for unknown methods', async () => {
      const program = Effect.gen(function* () {
        const transport = yield* TransportService
        return yield* transport.request<string>('eth_unknown', [])
      }).pipe(Effect.provide(TestTransport({})))

      const exit = await Effect.runPromiseExit(program)
      expect(exit._tag).toBe('Failure')
    })

    it('can mock errors', async () => {
      const responses = new Map([
        ['eth_call', new TransportError({ code: -32000, message: 'execution reverted' })],
      ])
      const program = Effect.gen(function* () {
        const transport = yield* TransportService
        return yield* transport.request<string>('eth_call', [])
      }).pipe(Effect.provide(TestTransport(responses)))

      const exit = await Effect.runPromiseExit(program)
      expect(exit._tag).toBe('Failure')
    })
  })

  describe('HttpTransport', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    const originalFetch = globalThis.fetch

    beforeEach(() => {
      fetchMock = vi.fn()
      globalThis.fetch = fetchMock as unknown as typeof fetch
    })

    afterEach(() => {
      globalThis.fetch = originalFetch
    })

    it('makes JSON-RPC requests', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x5678' }),
      })

      const program = Effect.gen(function* () {
        const transport = yield* TransportService
        return yield* transport.request<string>('eth_blockNumber', [])
      }).pipe(Effect.provide(HttpTransport({ url: 'https://eth.example.com' })))

      const result = await Effect.runPromise(program)
      expect(result).toBe('0x5678')

      expect(fetchMock).toHaveBeenCalled()
    })

    it('accepts string URL shorthand', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x1' }),
      })

      const program = Effect.gen(function* () {
        const transport = yield* TransportService
        return yield* transport.request<string>('eth_chainId', [])
      }).pipe(Effect.provide(HttpTransport('https://eth.example.com')))

      const result = await Effect.runPromise(program)
      expect(result).toBe('0x1')
    })

    it('includes custom headers', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x1' }),
      })

      const program = Effect.gen(function* () {
        const transport = yield* TransportService
        return yield* transport.request<string>('eth_chainId', [])
      }).pipe(
        Effect.provide(
          HttpTransport({
            url: 'https://eth.example.com',
            headers: { 'X-Api-Key': 'secret' },
          })
        )
      )

      const result = await Effect.runPromise(program)
      expect(result).toBe('0x1')
      expect(fetchMock).toHaveBeenCalled()
    })

    it('handles JSON-RPC errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          error: { code: -32000, message: 'execution reverted' },
        }),
      })

      const program = Effect.gen(function* () {
        const transport = yield* TransportService
        return yield* transport.request<string>('eth_call', [])
      }).pipe(Effect.provide(HttpTransport({ url: 'https://eth.example.com' })))

      const exit = await Effect.runPromiseExit(program)
      expect(exit._tag).toBe('Failure')
      if (exit._tag === 'Failure') {
        const error = exit.cause
        expect(error._tag).toBe('Fail')
      }
    })

    it('handles HTTP errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      })

      const program = Effect.gen(function* () {
        const transport = yield* TransportService
        return yield* transport.request<string>('eth_blockNumber', [])
      }).pipe(Effect.provide(HttpTransport({ url: 'https://eth.example.com', retries: 0 })))

      const exit = await Effect.runPromiseExit(program)
      expect(exit._tag).toBe('Failure')
    })
  })

  describe('BrowserTransport', () => {
    const originalWindow = globalThis.window

    afterEach(() => {
      ;(globalThis as unknown as { window: typeof window }).window = originalWindow
    })

    it('fails when no browser wallet', async () => {
      ;(globalThis as unknown as { window: undefined }).window = undefined

      const program = Effect.gen(function* () {
        const transport = yield* TransportService
        return yield* transport.request<string>('eth_accounts', [])
      }).pipe(Effect.provide(BrowserTransport))

      const exit = await Effect.runPromiseExit(program)
      expect(exit._tag).toBe('Failure')
    })

    it('calls window.ethereum.request', async () => {
      const mockRequest = vi.fn().mockResolvedValue(['0x1234567890123456789012345678901234567890'])
      ;(globalThis as unknown as { window: { ethereum: { request: typeof mockRequest } } }).window = {
        ethereum: { request: mockRequest },
      }

      const program = Effect.gen(function* () {
        const transport = yield* TransportService
        return yield* transport.request<string[]>('eth_accounts', [])
      }).pipe(Effect.provide(BrowserTransport))

      const result = await Effect.runPromise(program)
      expect(result).toEqual(['0x1234567890123456789012345678901234567890'])
      expect(mockRequest).toHaveBeenCalledWith({ method: 'eth_accounts', params: [] })
    })
  })
})
