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
export declare const ERC721InvalidOwner: {
    readonly type: "error";
    readonly name: "ERC721InvalidOwner";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly type: "address";
    }];
};
/**
 * Token does not exist
 * error ERC721NonexistentToken(uint256 tokenId)
 */
export declare const ERC721NonexistentToken: {
    readonly type: "error";
    readonly name: "ERC721NonexistentToken";
    readonly inputs: readonly [{
        readonly name: "tokenId";
        readonly type: "uint256";
    }];
};
/**
 * Sender is not the owner
 * error ERC721IncorrectOwner(address sender, uint256 tokenId, address owner)
 */
export declare const ERC721IncorrectOwner: {
    readonly type: "error";
    readonly name: "ERC721IncorrectOwner";
    readonly inputs: readonly [{
        readonly name: "sender";
        readonly type: "address";
    }, {
        readonly name: "tokenId";
        readonly type: "uint256";
    }, {
        readonly name: "owner";
        readonly type: "address";
    }];
};
/**
 * Invalid sender address
 * error ERC721InvalidSender(address sender)
 */
export declare const ERC721InvalidSender: {
    readonly type: "error";
    readonly name: "ERC721InvalidSender";
    readonly inputs: readonly [{
        readonly name: "sender";
        readonly type: "address";
    }];
};
/**
 * Invalid receiver address
 * error ERC721InvalidReceiver(address receiver)
 */
export declare const ERC721InvalidReceiver: {
    readonly type: "error";
    readonly name: "ERC721InvalidReceiver";
    readonly inputs: readonly [{
        readonly name: "receiver";
        readonly type: "address";
    }];
};
/**
 * Insufficient approval for operation
 * error ERC721InsufficientApproval(address operator, uint256 tokenId)
 */
export declare const ERC721InsufficientApproval: {
    readonly type: "error";
    readonly name: "ERC721InsufficientApproval";
    readonly inputs: readonly [{
        readonly name: "operator";
        readonly type: "address";
    }, {
        readonly name: "tokenId";
        readonly type: "uint256";
    }];
};
/**
 * Invalid approver address
 * error ERC721InvalidApprover(address approver)
 */
export declare const ERC721InvalidApprover: {
    readonly type: "error";
    readonly name: "ERC721InvalidApprover";
    readonly inputs: readonly [{
        readonly name: "approver";
        readonly type: "address";
    }];
};
/**
 * Invalid operator address
 * error ERC721InvalidOperator(address operator)
 */
export declare const ERC721InvalidOperator: {
    readonly type: "error";
    readonly name: "ERC721InvalidOperator";
    readonly inputs: readonly [{
        readonly name: "operator";
        readonly type: "address";
    }];
};
//# sourceMappingURL=ERC721Errors.d.ts.map