// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

contract TenThousandHashes {
    function Benchmark() external pure {
        for (uint256 i = 0; i < 20000; i++) {
            keccak256(abi.encodePacked(i));
        }
    }
}