// SPDX-License-Identifier: none
pragma solidity ^0.8.17;

import "./interfaces/IDEX.sol";
import "./interfaces/IAccount.sol";
import "./libraries/ArrayLib.sol";
import "openzeppelin-contracts/utils/EnumerableSet.sol";
import "openzeppelin-contracts/access/Ownable.sol";

contract DEX is IDEX, IAccount, Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;
    using ArrayLib for string[];

    EnumerableSet.AddressSet private tokens;

    mapping (string => Pair) Pairs;
    string[] PairsList;

    mapping (string => Order[]) PairOrders;

    // events
    event PairAdded(string name);
    event PairDeleted(string name);

    // modifiers
    modifier onlyCreator(Order storage order) {
        require(msg.sender == order.creator);
        _;
    }

    modifier pairExists(string calldata pair_name) {
        require(Pairs[pair_name].first_token_addr != address(0), "Pair doesn't exist");
        _;
    }

    // owner functions
    function addPair(string calldata pair_name,
                     address first_token_addr, 
                     uint first_token_decimals, 
                     address second_token_addr, 
                     uint second_token_decimals) external onlyOwner {
        require(Pairs[pair_name].first_token_addr == address(0), "Pair exists");
        tokens.add(first_token_addr);
        tokens.add(second_token_addr);
        Pair memory p = Pair({first_token_addr: first_token_addr, 
                        second_token_addr: second_token_addr,
                        first_token_decimals: first_token_decimals,
                        second_token_decimals: second_token_decimals});
        Pairs[pair_name] = p;
        PairsList.push(pair_name);
        emit PairAdded(pair_name);
    }

    function deletePair(string calldata pair_name) external onlyOwner pairExists(pair_name) {
        Pair storage p = Pairs[pair_name];
        tokens.remove(p.first_token_addr);
        tokens.remove(p.second_token_addr);
        PairsList.remove(pair_name);
        delete PairOrders[pair_name];
        delete Pairs[pair_name];
        emit PairDeleted(pair_name);
    }

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