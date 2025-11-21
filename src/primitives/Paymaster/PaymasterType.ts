import type { brand } from "../../brand.js";
import type { AddressType } from "../Address/AddressType.js";

/**
 * Paymaster address type - ERC-4337 paymaster contract
 *
 * Paymasters sponsor gas fees for user operations, enabling gasless transactions
 * or allowing users to pay gas in ERC-20 tokens.
 *
 * @see https://eips.ethereum.org/EIPS/eip-4337
 * @see https://voltaire.tevm.sh/primitives/paymaster for Paymaster documentation
 * @since 0.0.0
 */
export type PaymasterType = AddressType & { readonly [brand]: "Paymaster" };
