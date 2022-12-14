// SPDX-License-Identifier: none
pragma solidity ^0.8.17;

library ArrayLib {
    // for string arrays
    function exists(string[] storage data, string calldata element) internal view returns(bool) {
        for (uint i = 0; i < data.length; i++) {
            if (keccak256(abi.encodePacked(data[i])) == keccak256(abi.encodePacked(element))) {
                return true;
            }
        }
        return false;
    }

    function remove(string[] storage data, string calldata element) internal {
        for (uint i = 0; i < data.length; i++) {
            if (keccak256(abi.encodePacked(data[i])) == keccak256(abi.encodePacked(element))) {
                data[i] = data[data.length - 1];
                data.pop();
                return;
            }
        }
    }
}