import { verify } from "./verify.js";

/**
 * Process authorization and return delegation designation
 *
 * @param {import("./BrandedAuthorization.js").BrandedAuthorization} auth - Authorization to process
 * @returns {{authority: import("../../Address/BrandedAddress/BrandedAddress.js").BrandedAddress, delegatedAddress: import("../../Address/BrandedAddress/BrandedAddress.js").BrandedAddress}} Delegation designation with authority and delegated address
 * @throws {import("./errors.js").ValidationError} if authorization is invalid
 *
 * @example
 * ```typescript
 * const auth: Item = {...};
 * const delegation = process(auth);
 * console.log(`${delegation.authority} delegates to ${delegation.delegatedAddress}`);
 * ```
 */
export function process(auth) {
	// Validate and recover authority
	const authority = verify(auth);

	return {
		authority,
		delegatedAddress: auth.address,
	};
}
