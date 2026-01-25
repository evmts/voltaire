/**
 * @fileoverview Contract factory for type-safe smart contract interactions.
 * 
 * @module Contract
 * @since 0.0.1
 * 
 * @description
 * Provides a factory function to create type-safe contract instances from
 * an ABI and address. The resulting instance provides:
 * 
 * - `.read` - Read-only methods (view/pure functions)
 * - `.write` - State-changing methods (returns tx hash)
 * - `.simulate` - Simulate write methods without sending
 * - `.getEvents` - Query historical events
 * 
 * All methods are type-safe based on the ABI definition.
 * 
 * Requires PublicClientService for read operations.
 * Write operations additionally require WalletClientService.
 * 
 * @see {@link ContractInstance} - The returned contract interface
 * @see {@link PublicClientService} - Required for all operations
 * @see {@link WalletClientService} - Required for write operations
 */

import { BrandedAbi, Hex, Hash, Address } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import { PublicClientService, type LogType, type LogFilter as PublicLogFilter } from '../PublicClient/index.js'

import { WalletClientService } from '../WalletClient/index.js'
import { BrandedAddress, BrandedHex, BrandedHash } from '@tevm/voltaire'

type AddressType = BrandedAddress.AddressType
type HexType = BrandedHex.HexType
type HashType = BrandedHash.HashType
import {
  ContractCallError,
  ContractWriteError,
  ContractEventError,
  type ContractInstance,
  type EventFilter,
  type DecodedEvent,
  type Abi,
  type AbiItem,
} from './ContractTypes.js'

/**
 * Encodes function arguments for a contract call.
 * 
 * @param abi - The contract ABI
 * @param functionName - The function to encode
 * @param args - The arguments to encode
 * @returns Encoded calldata as hex
 * 
 * @internal
 */
function encodeArgs(abi: readonly AbiItem[], functionName: string, args: readonly unknown[]): HexType {
  return BrandedAbi.encodeFunction(abi as unknown as BrandedAbi.Abi, functionName, args)
}

/**
 * Decodes the result of a contract call.
 * @param abi - The contract ABI
 * @param functionName - The function that was called
 * @param data - The raw return data
 * @returns Decoded result (single value or tuple)
 */
function decodeResult(abi: readonly AbiItem[], functionName: string, data: HexType): unknown {
  const fn = abi.find(
    (item): item is BrandedAbi.Function.FunctionType => 
      item.type === 'function' && (item as any).name === functionName
  ) as BrandedAbi.Function.FunctionType | undefined
  if (!fn) throw new Error(`Function ${functionName} not found`)
  
  const bytes = Hex.toBytes(data)
  const decoded = BrandedAbi.Function.decodeResult(fn, bytes)
  if (fn.outputs.length === 1) {
    return decoded[0]
  }
  return decoded
}

/**
 * Gets the event topic (selector) for an event.
 * @param abi - The contract ABI
 * @param eventName - The event name
 * @returns Hex-encoded topic (keccak256 of event signature)
 */
function getEventTopic(abi: readonly AbiItem[], eventName: string): string {
  const event = abi.find(
    (item) => item.type === 'event' && item.name === eventName
  ) as BrandedAbi.Event.EventType | undefined
  if (!event) throw new Error(`Event ${eventName} not found`)
  const selector = BrandedAbi.Event.getSelector(event)
  return Hash.toHex(selector) as string
}

/**
 * Decodes a raw event log into a structured event.
 * @param abi - The contract ABI
 * @param eventName - The expected event name
 * @param log - The raw log data
 * @returns Decoded event with name, args, and metadata
 */
function decodeEventLog(abi: readonly AbiItem[], eventName: string, log: LogType): DecodedEvent {
  const event = abi.find(
    (item) => item.type === 'event' && item.name === eventName
  ) as BrandedAbi.Event.EventType | undefined
  if (!event) throw new Error(`Event ${eventName} not found`)
  
  const dataBytes = Hex.toBytes(log.data as `0x${string}`)
  const topicBytes = log.topics.map((t) => Hex.toBytes(t as `0x${string}`)) as unknown as readonly HashType[]
  const decoded = BrandedAbi.Event.decodeLog(event, dataBytes, topicBytes)
  
  return {
    eventName,
    args: decoded as Record<string, unknown>,
    blockNumber: BigInt(log.blockNumber),
    transactionHash: log.transactionHash as HexType,
    logIndex: Number.parseInt(log.logIndex, 16),
  }
}

/**
 * Creates a type-safe contract instance for interacting with a deployed contract.
 * Provides read, write, simulate, and event methods based on the ABI.
 * 
 * @param address - The contract address
 * @param abi - The contract ABI
 * @returns Effect that resolves to a ContractInstance
 * 
 * @example
 * ```typescript
 * const erc20Abi = [
 *   { type: 'function', name: 'balanceOf', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
 *   { type: 'function', name: 'transfer', inputs: [{ type: 'address' }, { type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable' },
 *   { type: 'event', name: 'Transfer', inputs: [{ type: 'address', indexed: true }, { type: 'address', indexed: true }, { type: 'uint256' }] }
 * ] as const
 * 
 * const program = Effect.gen(function* () {
 *   const token = yield* Contract(tokenAddress, erc20Abi)
 *   const balance = yield* token.read.balanceOf(userAddress)
 *   const txHash = yield* token.write.transfer(recipient, amount)
 *   const events = yield* token.getEvents('Transfer', { fromBlock: 'latest' })
 *   return { balance, txHash, events }
 * }).pipe(
 *   Effect.provide(PublicClient),
 *   Effect.provide(WalletClientLive),
 *   Effect.provide(HttpTransport('https://...'))
 * )
 * ```
 * @since 0.0.1
 */
export const Contract = <TAbi extends Abi>(
  address: AddressType | `0x${string}`,
  abi: TAbi
): Effect.Effect<ContractInstance<TAbi>, never, PublicClientService> =>
  Effect.gen(function* () {
    const publicClient = yield* PublicClientService
    const abiItems = abi as readonly AbiItem[]
    const addressHex = typeof address === 'string' ? address : Address.toHex(address as AddressType)
    const brandedAddress = typeof address === 'string' ? Address.fromHex(address) : address as AddressType

    const viewFunctions = abiItems.filter(
      (item): item is AbiItem & { name: string; stateMutability: 'view' | 'pure' } =>
        item.type === 'function' &&
        (item.stateMutability === 'view' || item.stateMutability === 'pure') &&
        item.name !== undefined
    )

    const writeFunctions = abiItems.filter(
      (item): item is AbiItem & { name: string } =>
        item.type === 'function' &&
        item.stateMutability !== 'view' &&
        item.stateMutability !== 'pure' &&
        item.name !== undefined
    )

    const read = {} as ContractInstance<TAbi>['read']
    for (const fn of viewFunctions) {
      (read as unknown as Record<string, (...args: unknown[]) => Effect.Effect<unknown, ContractCallError>>)[fn.name] = 
        (...args: unknown[]) =>
          Effect.gen(function* () {
            const data = encodeArgs(abiItems, fn.name, args)
            const result = yield* publicClient.call({ to: addressHex, data }).pipe(
              Effect.mapError((e) => new ContractCallError({ address: addressHex, method: fn.name, args }, e.message, { cause: e }))
            )
            return decodeResult(abiItems, fn.name, result as HexType)
          })
    }

    const write = {} as ContractInstance<TAbi>['write']
    for (const fn of writeFunctions) {
      (write as unknown as Record<string, (...args: unknown[]) => Effect.Effect<HexType, ContractWriteError, WalletClientService>>)[fn.name] = 
        (...args: unknown[]) =>
          Effect.gen(function* () {
            const walletClient = yield* WalletClientService
            const data = encodeArgs(abiItems, fn.name, args)
            const txHash = yield* walletClient.sendTransaction({ to: brandedAddress as unknown as undefined, data: data as unknown as undefined }).pipe(
              Effect.mapError((e) => new ContractWriteError({ address: addressHex, method: fn.name, args }, e.message, { cause: e }))
            )
            return txHash as HexType
          })
    }

    const simulate = {} as ContractInstance<TAbi>['simulate']
    for (const fn of writeFunctions) {
      (simulate as unknown as Record<string, (...args: unknown[]) => Effect.Effect<unknown, ContractCallError>>)[fn.name] = 
        (...args: unknown[]) =>
          Effect.gen(function* () {
            const data = encodeArgs(abiItems, fn.name, args)
            const result = yield* publicClient.call({ to: addressHex, data }).pipe(
              Effect.mapError((e) => new ContractCallError({ address: addressHex, method: fn.name, args, simulate: true }, e.message, { cause: e }))
            )
            return decodeResult(abiItems, fn.name, result as HexType)
          })
    }

    const getEvents = <E extends string>(
      eventName: E,
      filter?: EventFilter
    ): Effect.Effect<DecodedEvent[], ContractEventError> =>
      Effect.gen(function* () {
        const topic = getEventTopic(abiItems, eventName)
        
        const toPublicBlockTag = (tag: import('./ContractTypes.js').BlockTag | undefined) => {
          if (tag === undefined) return undefined
          if (typeof tag === 'bigint') return `0x${tag.toString(16)}` as const
          return tag
        }
        
        const logFilter: PublicLogFilter = {
          address: addressHex,
          topics: [topic as `0x${string}`],
          fromBlock: toPublicBlockTag(filter?.fromBlock),
          toBlock: toPublicBlockTag(filter?.toBlock),
        }
        
        const logs = yield* publicClient.getLogs(logFilter).pipe(
          Effect.mapError((e) => new ContractEventError({ address: addressHex, event: eventName, filter }, e.message, { cause: e }))
        )
        
        return logs.map((log) => decodeEventLog(abiItems, eventName, log))
      })

    return {
      address: brandedAddress,
      abi,
      read,
      write,
      simulate,
      getEvents,
    } as ContractInstance<TAbi>
  })
