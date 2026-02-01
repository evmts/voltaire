/**
 * @typedef {Object} PermissionRevocation
 * @property {Object} [eth_accounts] - Revoke eth_accounts permission
 */

/**
 * @param {PermissionRevocation} permissions
 * @returns {{ method: string, params: [PermissionRevocation] }}
 */
export function WalletRevokePermissionsRequest(permissions) {
	return {
		method: "wallet_revokePermissions",
		params: [permissions],
	};
}
