// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Arithmetic {
    function benchmark() public pure returns (uint256) {
        unchecked {
            uint256 result = 0;
            uint256 a = 12345;
            uint256 b = 67890;
            
            for (uint256 i = 0; i < 1000; i++) {
                result = a + b;
                result = result - 1000;
                result = result * 2;
                result = result / 3;
                result = result % 7;
                
                a = result + i;
                b = a * 2;
            }
            
            return result;
        }
    }
}