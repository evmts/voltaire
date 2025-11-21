/**
 * @typedef {Object} PermissionRequest
 * @property {Object} [eth_accounts] - Request eth_accounts permission
 */

/**
 * @param {PermissionRequest} permissions
 * @returns {{ method: string, params: [PermissionRequest] }}
 */
export function WalletRequestPermissionsRequest(permissions) {
	return {
		method: "wallet_requestPermissions",
		params: [permissions],
	};
}
