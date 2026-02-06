/**
 * ERC-6093: Custom Errors for ERC-20 Tokens
 *
 * @see https://eips.ethereum.org/EIPS/eip-6093
 * @since 0.0.0
 */
/**
 * Insufficient balance for transfer
 * error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)
 */
export const ERC20InsufficientBalance = {
    type: "error",
    name: "ERC20InsufficientBalance",
    inputs: [
        { name: "sender", type: "address" },
        { name: "balance", type: "uint256" },
        { name: "needed", type: "uint256" },
    ],
};
/**
 * Invalid sender address
 * error ERC20InvalidSender(address sender)
 */
export const ERC20InvalidSender = {
    type: "error",
    name: "ERC20InvalidSender",
    inputs: [{ name: "sender", type: "address" }],
};
/**
 * Invalid receiver address
 * error ERC20InvalidReceiver(address receiver)
 */
export const ERC20InvalidReceiver = {
    type: "error",
    name: "ERC20InvalidReceiver",
    inputs: [{ name: "receiver", type: "address" }],
};
/**
 * Insufficient allowance for transfer
 * error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed)
 */
export const ERC20InsufficientAllowance = {
    type: "error",
    name: "ERC20InsufficientAllowance",
    inputs: [
        { name: "spender", type: "address" },
        { name: "allowance", type: "uint256" },
        { name: "needed", type: "uint256" },
    ],
};
/**
 * Invalid approver address
 * error ERC20InvalidApprover(address approver)
 */
export const ERC20InvalidApprover = {
    type: "error",
    name: "ERC20InvalidApprover",
    inputs: [{ name: "approver", type: "address" }],
};
/**
 * Invalid spender address
 * error ERC20InvalidSpender(address spender)
 */
export const ERC20InvalidSpender = {
    type: "error",
    name: "ERC20InvalidSpender",
    inputs: [{ name: "spender", type: "address" }],
};
