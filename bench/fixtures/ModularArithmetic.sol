// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ModularArithmetic {
    function benchmark() public pure returns (uint256) {
        unchecked {
            uint256 result = 1;
            uint256 base = 3;
            uint256 modulus = 1000007;
            
            for (uint256 i = 1; i <= 100; i++) {
                result = mulmod(result, base, modulus);
                result = addmod(result, i, modulus);
                
                if (i % 10 == 0 && i / 10 <= 10) {
                    // Limit exponent to avoid gas issues
                    uint256 exp = i / 10;
                    uint256 temp = base;
                    for (uint256 j = 1; j < exp; j++) {
                        temp = mulmod(temp, base, modulus);
                    }
                    result = temp;
                }
            }
            
            return result;
        }
    }
}