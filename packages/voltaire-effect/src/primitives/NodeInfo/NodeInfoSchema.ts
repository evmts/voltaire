import { NodeInfo } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * The NodeInfo type representing Ethereum node information.
 * Contains details like enode URL, node ID, IP, name, ports, and protocols.
 * @since 0.0.1
 */
type NodeInfoType = ReturnType<typeof NodeInfo.from>;

/**
 * Internal schema declaration for NodeInfo type validation.
 * @internal
 */
const NodeInfoTypeSchema = S.declare<NodeInfoType>(
	(u): u is NodeInfoType => {
		if (typeof u !== "object" || u === null) return false;
		const obj = u as Record<string, unknown>;
		return (
			typeof obj.enode === "string" &&
			typeof obj.id === "string" &&
			typeof obj.ip === "string" &&
			typeof obj.name === "string" &&
			typeof obj.ports === "object" &&
			typeof obj.protocols === "object"
		);
	},
	{ identifier: "NodeInfo" },
);

/**
 * Effect Schema for validating and parsing Ethereum node information.
 * Node info is returned by admin_nodeInfo RPC method.
 *
 * @param input - An object containing node information fields
 * @returns The validated NodeInfoType
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { NodeInfoSchema } from 'voltaire-effect/NodeInfo'
 *
 * // Parse node info from RPC response
 * const nodeInfo = S.decodeSync(NodeInfoSchema)({
 *   enode: 'enode://abc123@127.0.0.1:30303',
 *   id: 'abc123',
 *   ip: '127.0.0.1',
 *   name: 'Geth/v1.10.0',
 *   ports: { discovery: 30303, listener: 30303 },
 *   protocols: { eth: { network: 1, difficulty: 1000 } }
 * })
 * ```
 *
 * @since 0.0.1
 */
export const NodeInfoSchema: S.Schema<NodeInfoType, unknown> =
	S.transformOrFail(S.Unknown, NodeInfoTypeSchema, {
		strict: true,
		decode: (value, _options, ast) => {
			try {
				return ParseResult.succeed(NodeInfo.from(value));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, value, (e as Error).message),
				);
			}
		},
		encode: (nodeInfo) => ParseResult.succeed(nodeInfo as unknown),
	}).annotations({ identifier: "NodeInfoSchema" });
