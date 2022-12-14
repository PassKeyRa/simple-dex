// SPDX-License-Identifier: none
pragma solidity ^0.8.17;

import "./IDEXStructs.sol";

interface IDEX is IDEXStructs {
    // owner functions
    function addPair(string calldata pair_name,
                     address first_token_addr, 
                     uint first_token_decimals, 
                     address second_token_addr, 
                     uint second_token_decimals) external;
    function deletePair(string calldata pair_name) external;

/*
    // view functions
    function fetchPairs() external view returns(string[] memory);
    function getPair(string calldata pair_name) external view returns(Pair memory);
    function fetchOrders(string calldata pair_name) external view returns(Order[] memory);
    function fetchUserOrders(string calldata pair_name) external view returns(Order[] memory);
    function getOrder(uint order_id) external view returns(Order memory);

    // user functions
    function buyOrderMarket(string calldata pair_name, uint amount) external;
    function buyOrderLimit(string calldata pair_name, uint first_token_amount, uint second_token_amount) external;
    function sellOrderMarket(string calldata pair_name, uint amount) external;
    function sellOrderLimit(string calldata pair_name, uint first_token_amount, uint second_token_amount) external;
    function deleteOrder(uint id) external;
*/
}