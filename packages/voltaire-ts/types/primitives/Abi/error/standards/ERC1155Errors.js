/**
 * ERC-6093: Custom Errors for ERC-1155 Tokens
 *
 * @see https://eips.ethereum.org/EIPS/eip-6093
 * @since 0.0.0
 */
/**
 * Insufficient balance for transfer
 * error ERC1155InsufficientBalance(address sender, uint256 balance, uint256 needed, uint256 tokenId)
 */
export const ERC1155InsufficientBalance = {
    type: "error",
    name: "ERC1155InsufficientBalance",
    inputs: [
        { name: "sender", type: "address" },
        { name: "balance", type: "uint256" },
        { name: "needed", type: "uint256" },
        { name: "tokenId", type: "uint256" },
    ],
};
/**
 * Invalid sender address
 * error ERC1155InvalidSender(address sender)
 */
export const ERC1155InvalidSender = {
    type: "error",
    name: "ERC1155InvalidSender",
    inputs: [{ name: "sender", type: "address" }],
};
/**
 * Invalid receiver address
 * error ERC1155InvalidReceiver(address receiver)
 */
export const ERC1155InvalidReceiver = {
    type: "error",
    name: "ERC1155InvalidReceiver",
    inputs: [{ name: "receiver", type: "address" }],
};
/**
 * Missing approval for all tokens
 * error ERC1155MissingApprovalForAll(address operator, address owner)
 */
export const ERC1155MissingApprovalForAll = {
    type: "error",
    name: "ERC1155MissingApprovalForAll",
    inputs: [
        { name: "operator", type: "address" },
        { name: "owner", type: "address" },
    ],
};
/**
 * Invalid approver address
 * error ERC1155InvalidApprover(address approver)
 */
export const ERC1155InvalidApprover = {
    type: "error",
    name: "ERC1155InvalidApprover",
    inputs: [{ name: "approver", type: "address" }],
};
/**
 * Invalid operator address
 * error ERC1155InvalidOperator(address operator)
 */
export const ERC1155InvalidOperator = {
    type: "error",
    name: "ERC1155InvalidOperator",
    inputs: [{ name: "operator", type: "address" }],
};
/**
 * Array length mismatch
 * error ERC1155InvalidArrayLength(uint256 idsLength, uint256 valuesLength)
 */
export const ERC1155InvalidArrayLength = {
    type: "error",
    name: "ERC1155InvalidArrayLength",
    inputs: [
        { name: "idsLength", type: "uint256" },
        { name: "valuesLength", type: "uint256" },
    ],
};
