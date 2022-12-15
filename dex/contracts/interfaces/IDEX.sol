// SPDX-License-Identifier: none
pragma solidity ^0.8.17;

import "./IDEXStructs.sol";

interface IDEX is IDEXStructs {
    // owner functions
    function addPair(string calldata pair_name,
                     address first_token_addr, 
                     address second_token_addr, 
                     uint price_decimals) external;
    function deletePair(string calldata pair_name) external;


    // view functions
    function fetchPairs() external view returns(string[] memory);
    function getPair(string calldata pair_name) external view returns(Pair memory);

    function fetchBuyOrders(string calldata pair_name) external view returns(Order[] memory);
    function fetchSellOrders(string calldata pair_name) external view returns(Order[] memory);
    //function fetchUserOrders(string calldata pair_name) external view returns(Order[] memory);


    // user functions
    function buyOrderMarket(string calldata pair_name, uint amount) external;
    function buyOrderLimit(string calldata pair_name, uint amount, uint price) external;
    function sellOrderMarket(string calldata pair_name, uint amount) external;
    function sellOrderLimit(string calldata pair_name, uint amount, uint price) external;
    function deleteOrder(uint id) external;

}