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
export declare const ERC1155InsufficientBalance: {
    readonly type: "error";
    readonly name: "ERC1155InsufficientBalance";
    readonly inputs: readonly [{
        readonly name: "sender";
        readonly type: "address";
    }, {
        readonly name: "balance";
        readonly type: "uint256";
    }, {
        readonly name: "needed";
        readonly type: "uint256";
    }, {
        readonly name: "tokenId";
        readonly type: "uint256";
    }];
};
/**
 * Invalid sender address
 * error ERC1155InvalidSender(address sender)
 */
export declare const ERC1155InvalidSender: {
    readonly type: "error";
    readonly name: "ERC1155InvalidSender";
    readonly inputs: readonly [{
        readonly name: "sender";
        readonly type: "address";
    }];
};
/**
 * Invalid receiver address
 * error ERC1155InvalidReceiver(address receiver)
 */
export declare const ERC1155InvalidReceiver: {
    readonly type: "error";
    readonly name: "ERC1155InvalidReceiver";
    readonly inputs: readonly [{
        readonly name: "receiver";
        readonly type: "address";
    }];
};
/**
 * Missing approval for all tokens
 * error ERC1155MissingApprovalForAll(address operator, address owner)
 */
export declare const ERC1155MissingApprovalForAll: {
    readonly type: "error";
    readonly name: "ERC1155MissingApprovalForAll";
    readonly inputs: readonly [{
        readonly name: "operator";
        readonly type: "address";
    }, {
        readonly name: "owner";
        readonly type: "address";
    }];
};
/**
 * Invalid approver address
 * error ERC1155InvalidApprover(address approver)
 */
export declare const ERC1155InvalidApprover: {
    readonly type: "error";
    readonly name: "ERC1155InvalidApprover";
    readonly inputs: readonly [{
        readonly name: "approver";
        readonly type: "address";
    }];
};
/**
 * Invalid operator address
 * error ERC1155InvalidOperator(address operator)
 */
export declare const ERC1155InvalidOperator: {
    readonly type: "error";
    readonly name: "ERC1155InvalidOperator";
    readonly inputs: readonly [{
        readonly name: "operator";
        readonly type: "address";
    }];
};
/**
 * Array length mismatch
 * error ERC1155InvalidArrayLength(uint256 idsLength, uint256 valuesLength)
 */
export declare const ERC1155InvalidArrayLength: {
    readonly type: "error";
    readonly name: "ERC1155InvalidArrayLength";
    readonly inputs: readonly [{
        readonly name: "idsLength";
        readonly type: "uint256";
    }, {
        readonly name: "valuesLength";
        readonly type: "uint256";
    }];
};
//# sourceMappingURL=ERC1155Errors.d.ts.map