/**
 * ERC-20 balanceOf - Check token balances
 *
 * The balanceOf function returns the token balance of an account.
 */

import { Address, ERC20 } from "@tevm/voltaire";

// Create an address to check balance for
const account = Address("0x742d35Cc6634C0532925a3b844Bc9e7595f5bEb2");

// Encode balanceOf(address) calldata
const calldata = ERC20.encodeBalanceOf(account);

// Simulating decoding a return value
// In practice, this would come from an eth_call response
const mockReturnData =
	"0x0000000000000000000000000000000000000000000000056bc75e2d63100000";
const balance = ERC20.decodeUint256(mockReturnData);
