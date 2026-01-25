import type { TypedData, Signature, Domain, TypeDefinitions, Message } from '@tevm/voltaire/EIP712'
import type { HashType } from '@tevm/voltaire/Hash'
import type { AddressType } from '@tevm/voltaire/Address'
import * as Effect from 'effect/Effect'
import { EIP712Service } from './EIP712Service.js'

/**
 * Hashes typed structured data according to EIP-712.
 *
 * @param typedData - The typed data to hash
 * @returns Effect containing the 32-byte hash, requiring EIP712Service
 * @since 0.0.1
 */
export const hashTypedData = (typedData: TypedData): Effect.Effect<HashType, never, EIP712Service> =>
  Effect.gen(function* () {
    const eip712 = yield* EIP712Service
    return yield* eip712.hashTypedData(typedData)
  })

/**
 * Signs typed structured data according to EIP-712.
 *
 * @param typedData - The typed data to sign
 * @param privateKey - The private key as bytes or hex string
 * @returns Effect containing the signature, requiring EIP712Service
 * @since 0.0.1
 */
export const signTypedData = (typedData: TypedData, privateKey: Uint8Array | string): Effect.Effect<Signature, never, EIP712Service> =>
  Effect.gen(function* () {
    const eip712 = yield* EIP712Service
    return yield* eip712.signTypedData(typedData, privateKey)
  })

/**
 * Verifies an EIP-712 typed data signature.
 *
 * @param signature - The signature to verify
 * @param typedData - The typed data that was signed
 * @param address - The expected signer address
 * @returns Effect containing true if valid, requiring EIP712Service
 * @since 0.0.1
 */
export const verifyTypedData = (signature: Signature, typedData: TypedData, address: AddressType): Effect.Effect<boolean, never, EIP712Service> =>
  Effect.gen(function* () {
    const eip712 = yield* EIP712Service
    return yield* eip712.verifyTypedData(signature, typedData, address)
  })

/**
 * Recovers the signer address from an EIP-712 signature.
 *
 * @param signature - The signature
 * @param typedData - The typed data that was signed
 * @returns Effect containing the recovered address, requiring EIP712Service
 * @since 0.0.1
 */
export const recoverAddress = (signature: Signature, typedData: TypedData): Effect.Effect<AddressType, never, EIP712Service> =>
  Effect.gen(function* () {
    const eip712 = yield* EIP712Service
    return yield* eip712.recoverAddress(signature, typedData)
  })

/**
 * Hashes a domain separator according to EIP-712.
 *
 * @param domain - The domain parameters
 * @returns Effect containing the 32-byte domain hash, requiring EIP712Service
 * @since 0.0.1
 */
export const hashDomain = (domain: Domain): Effect.Effect<HashType, never, EIP712Service> =>
  Effect.gen(function* () {
    const eip712 = yield* EIP712Service
    return yield* eip712.hashDomain(domain)
  })

/**
 * Hashes a struct according to EIP-712 encoding.
 *
 * @param primaryType - The primary type name
 * @param data - The struct data
 * @param types - The type definitions
 * @returns Effect containing the 32-byte struct hash, requiring EIP712Service
 * @since 0.0.1
 */
export const hashStruct = (primaryType: string, data: Message, types: TypeDefinitions): Effect.Effect<HashType, never, EIP712Service> =>
  Effect.gen(function* () {
    const eip712 = yield* EIP712Service
    return yield* eip712.hashStruct(primaryType, data, types)
  })
