import { PeerInfo } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Type representing detailed information about a P2P network peer.
 * @since 0.0.1
 */
type PeerInfoType = ReturnType<typeof PeerInfo.from>;

const PeerInfoTypeSchema = S.declare<PeerInfoType>(
	(u): u is PeerInfoType => {
		if (typeof u !== "object" || u === null) return false;
		const obj = u as Record<string, unknown>;
		return (
			typeof obj.id === "string" &&
			typeof obj.name === "string" &&
			Array.isArray(obj.caps) &&
			typeof obj.network === "object" &&
			typeof obj.protocols === "object"
		);
	},
	{ identifier: "PeerInfo" },
);

/**
 * Effect Schema for validating and transforming peer information.
 *
 * Transforms raw peer data into a validated PeerInfoType containing
 * peer ID, name, capabilities, network info, and protocols.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { PeerInfoSchema } from 'voltaire-effect/primitives/PeerInfo'
 *
 * const peerInfo = S.decodeSync(PeerInfoSchema)({
 *   id: 'QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8...',
 *   name: 'Geth/v1.10.0',
 *   caps: ['eth/66', 'eth/67'],
 *   network: { localAddress: '127.0.0.1:30303' },
 *   protocols: { eth: { version: 67 } }
 * })
 * ```
 *
 * @since 0.0.1
 */
export const PeerInfoSchema: S.Schema<PeerInfoType, unknown> =
	S.transformOrFail(S.Unknown, PeerInfoTypeSchema, {
		strict: true,
		decode: (value, _options, ast) => {
			try {
				return ParseResult.succeed(PeerInfo.from(value));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, value, (e as Error).message),
				);
			}
		},
		encode: (peerInfo) => ParseResult.succeed(peerInfo as unknown),
	}).annotations({ identifier: "PeerInfoSchema" });
