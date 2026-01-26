/**
 * @fileoverview Effect Request for ERC-20 balanceOf calls batched via Multicall.
 *
 * @module GetBalance
 * @since 0.0.1
 */

import * as Data from "effect/Data";
import type * as Request from "effect/Request";
import type { AddressInput, BlockTag } from "../Provider/ProviderService.js";
import type { MulticallError } from "./MulticallService.js";

/**
 * Request to fetch an ERC-20 balance via Multicall.
 *
 * @since 0.0.1
 */
export class GetBalance extends Data.TaggedClass("GetBalance")<{
	/** ERC-20 contract address */
	readonly address: AddressInput;
	/** Account address to query */
	readonly account: AddressInput;
	/** Optional block tag (default: "latest") */
	readonly blockTag?: BlockTag;
}> {}

export interface GetBalance extends Request.Request<bigint, MulticallError> {}
