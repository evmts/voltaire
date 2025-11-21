import type { brand } from "../../brand.js";
import type { AddressType } from "../Address/AddressType.js";

/**
 * Bundler address type - ERC-4337 bundler node
 *
 * Bundlers aggregate user operations and submit them to the EntryPoint contract.
 * They monitor the mempool, simulate operations, and bundle them into transactions.
 *
 * @see https://eips.ethereum.org/EIPS/eip-4337
 * @see https://voltaire.tevm.sh/primitives/bundler for Bundler documentation
 * @since 0.0.0
 */
export type BundlerType = AddressType & { readonly [brand]: "Bundler" };
