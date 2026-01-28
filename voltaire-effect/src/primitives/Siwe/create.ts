/**
 * @module create
 * @description Effect-wrapped SIWE constructors
 * @since 0.1.0
 */
import { Effect } from "effect";
import { Siwe } from "@tevm/voltaire";
import type { SiweMessageType } from "./String.js";
import type { AddressType } from "@tevm/voltaire/Address";

interface CreateParams<
  TDomain extends string = string,
  TAddress extends AddressType = AddressType,
  TUri extends string = string,
  TChainId extends number = number,
> {
  domain: TDomain;
  address: TAddress | string;
  uri: TUri;
  chainId: TChainId;
  statement?: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
  nonce?: string;
  issuedAt?: string;
}

/**
 * Create SIWE message from parameters
 *
 * @param params - SIWE message parameters
 * @returns Effect yielding SiweMessageType
 * @example
 * ```typescript
 * const message = await Effect.runPromise(Siwe.create({
 *   domain: 'example.com',
 *   address: '0x...',
 *   uri: 'https://example.com',
 *   chainId: 1,
 * }))
 * ```
 */
export const create = <
  TDomain extends string = string,
  TAddress extends AddressType = AddressType,
  TUri extends string = string,
  TChainId extends number = number,
>(
  params: CreateParams<TDomain, TAddress, TUri, TChainId>,
): Effect.Effect<SiweMessageType, Error> =>
  Effect.try({
    try: () => Siwe.create(params as Parameters<typeof Siwe.create>[0]),
    catch: (e) => e as Error,
  });
