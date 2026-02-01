/**
 * ERC-6093: Custom Errors for ERC-721 Tokens
 *
 * @see https://eips.ethereum.org/EIPS/eip-6093
 * @since 0.0.0
 */
/**
 * Invalid owner address
 * error ERC721InvalidOwner(address owner)
 */
export const ERC721InvalidOwner = {
    type: "error",
    name: "ERC721InvalidOwner",
    inputs: [{ name: "owner", type: "address" }],
};
/**
 * Token does not exist
 * error ERC721NonexistentToken(uint256 tokenId)
 */
export const ERC721NonexistentToken = {
    type: "error",
    name: "ERC721NonexistentToken",
    inputs: [{ name: "tokenId", type: "uint256" }],
};
/**
 * Sender is not the owner
 * error ERC721IncorrectOwner(address sender, uint256 tokenId, address owner)
 */
export const ERC721IncorrectOwner = {
    type: "error",
    name: "ERC721IncorrectOwner",
    inputs: [
        { name: "sender", type: "address" },
        { name: "tokenId", type: "uint256" },
        { name: "owner", type: "address" },
    ],
};
/**
 * Invalid sender address
 * error ERC721InvalidSender(address sender)
 */
export const ERC721InvalidSender = {
    type: "error",
    name: "ERC721InvalidSender",
    inputs: [{ name: "sender", type: "address" }],
};
/**
 * Invalid receiver address
 * error ERC721InvalidReceiver(address receiver)
 */
export const ERC721InvalidReceiver = {
    type: "error",
    name: "ERC721InvalidReceiver",
    inputs: [{ name: "receiver", type: "address" }],
};
/**
 * Insufficient approval for operation
 * error ERC721InsufficientApproval(address operator, uint256 tokenId)
 */
export const ERC721InsufficientApproval = {
    type: "error",
    name: "ERC721InsufficientApproval",
    inputs: [
        { name: "operator", type: "address" },
        { name: "tokenId", type: "uint256" },
    ],
};
/**
 * Invalid approver address
 * error ERC721InvalidApprover(address approver)
 */
export const ERC721InvalidApprover = {
    type: "error",
    name: "ERC721InvalidApprover",
    inputs: [{ name: "approver", type: "address" }],
};
/**
 * Invalid operator address
 * error ERC721InvalidOperator(address operator)
 */
export const ERC721InvalidOperator = {
    type: "error",
    name: "ERC721InvalidOperator",
    inputs: [{ name: "operator", type: "address" }],
};
