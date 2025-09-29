// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Shifts {
    function benchmark() public pure returns (uint256) {
        unchecked {
            uint256 result = 1;
            int256 signedResult = -1;
            
            for (uint256 i = 0; i < 256; i++) {
                result = result << 1;
                result = result >> 1;
                
                signedResult = signedResult >> 1;
                signedResult = signedResult << 2;
                
                if (i % 64 == 0 && i > 0 && i < 256) {
                    result = type(uint256).max >> i;
                }
            }
            
            // Convert negative int to uint properly
            return result + (signedResult >= 0 ? uint256(signedResult) : 0);
        }
    }
}