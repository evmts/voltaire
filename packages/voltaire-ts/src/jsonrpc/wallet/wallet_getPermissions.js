/**
 * @returns {{ method: string, params: [] }}
 */
export function WalletGetPermissionsRequest() {
	return {
		method: "wallet_getPermissions",
		params: [],
	};
}
