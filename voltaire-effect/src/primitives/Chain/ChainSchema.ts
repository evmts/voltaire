import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Ethereum hardfork identifiers.
 * @since 0.0.1
 */
export type Hardfork =
  | 'chainstart'
  | 'homestead'
  | 'dao'
  | 'tangerineWhistle'
  | 'spuriousDragon'
  | 'byzantium'
  | 'constantinople'
  | 'petersburg'
  | 'istanbul'
  | 'muirGlacier'
  | 'berlin'
  | 'london'
  | 'arrowGlacier'
  | 'grayGlacier'
  | 'paris'
  | 'shanghai'
  | 'cancun'
  | 'prague'

/**
 * Metadata about an Ethereum chain's configuration.
 * @since 0.0.1
 */
export interface ChainMetadata {
  blockTime: number
  gasLimit: number
  isTestnet: boolean
  isL2: boolean
  l1ChainId?: number
  latestHardfork: Hardfork
  hardforks: Partial<Record<Hardfork, number>>
  websocketUrls?: string[]
}

/**
 * Native currency configuration for a chain.
 * @since 0.0.1
 */
export interface NativeCurrency {
  name: string
  symbol: string
  decimals: number
}

/**
 * Block explorer configuration.
 * @since 0.0.1
 */
export interface Explorer {
  name: string
  url: string
}

/**
 * Branded type representing an Ethereum chain configuration.
 * @since 0.0.1
 */
export interface ChainType {
  readonly __tag: 'Chain'
  id: number
  name: string
  nativeCurrency: NativeCurrency
  rpcUrls?: { default: { http: readonly string[] } }
  blockExplorers?: { default: Explorer }
}

const ChainTypeSchema = S.declare<ChainType>(
  (u): u is ChainType => {
    if (typeof u !== 'object' || u === null) return false
    const chain = u as Record<string, unknown>
    return (
      typeof chain.id === 'number' &&
      typeof chain.name === 'string' &&
      typeof chain.nativeCurrency === 'object' &&
      chain.nativeCurrency !== null
    )
  },
  { identifier: 'Chain' }
)

/**
 * Input type for creating a Chain.
 * @since 0.0.1
 */
export interface ChainInput {
  id: number
  name: string
  nativeCurrency: NativeCurrency
  rpcUrls?: { default: { http: readonly string[] } }
  blockExplorers?: { default: Explorer }
}

const ChainInputSchema = S.Struct({
  id: S.Number,
  name: S.String,
  nativeCurrency: S.Struct({
    name: S.String,
    symbol: S.String,
    decimals: S.Number
  }),
  rpcUrls: S.optional(S.Struct({
    default: S.Struct({
      http: S.Array(S.String)
    })
  })),
  blockExplorers: S.optional(S.Struct({
    default: S.Struct({
      name: S.String,
      url: S.String
    })
  }))
})

/**
 * Effect Schema for validating Ethereum chain configurations.
 * Transforms chain input data into branded ChainType values.
 *
 * @example
 * ```typescript
 * import * as Chain from 'voltaire-effect/Chain'
 * import * as Schema from 'effect/Schema'
 *
 * const chain = Schema.decodeSync(Chain.Schema)({
 *   id: 1,
 *   name: 'Ethereum',
 *   nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
 * })
 * ```
 * @since 0.0.1
 */
export const ChainSchema: S.Schema<ChainType, ChainInput> = S.transformOrFail(
  ChainInputSchema,
  ChainTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      if (typeof value.id !== 'number' || value.id <= 0) {
        return ParseResult.fail(new ParseResult.Type(ast, value, 'Chain ID must be a positive integer'))
      }
      return ParseResult.succeed({
        __tag: 'Chain' as const,
        ...value
      } as ChainType)
    },
    encode: (chain) => ParseResult.succeed({
      id: chain.id,
      name: chain.name,
      nativeCurrency: chain.nativeCurrency,
      rpcUrls: chain.rpcUrls,
      blockExplorers: chain.blockExplorers
    })
  }
).annotations({ identifier: 'ChainSchema' })
