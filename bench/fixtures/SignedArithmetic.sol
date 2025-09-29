// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SignedArithmetic {
    function benchmark() public pure returns (int256) {
        unchecked {
            int256 result = 0;
            int256 a = -12345;
            int256 b = 67890;
            
            for (uint256 i = 0; i < 1000; i++) {
                if (b != 0) {
                    result = a / b;
                    result = result % 7;
                }
                
                bytes32 data = bytes32(uint256(int256(result)));
                result = int256(uint256(data >> 8));
                
                a = result - int256(i);
                b = a * -2;
                if (b == 0) b = 1; // Avoid division by zero
            }
            
            return result;
        }
    }
}