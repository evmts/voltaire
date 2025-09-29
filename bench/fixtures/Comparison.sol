// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Comparison {
    function benchmark() public pure returns (uint256) {
        unchecked {
            uint256 count = 0;
            
            for (uint256 i = 0; i < 1000; i++) {
                uint256 a = i * 3;
                uint256 b = i * 2 + 1;
                int256 sa = int256(a);
                int256 sb = -int256(b);
                
                if (a < b) count++;
                if (a > b) count += 2;
                if (sa < sb) count += 3;
                if (sa > sb) count += 4;
                if (a == b) count += 5;
                if (a == 0) count += 6;
            }
            
            return count;
        }
    }
}