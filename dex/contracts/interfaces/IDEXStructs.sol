// SPDX-License-Identifier: none
pragma solidity ^0.8.17;

interface IDEXStructs {
    enum OrderType{BUY, SELL}

    struct Order {
        uint id;
        string pair_name;
        uint first_token_amount;
        uint second_token_amount;
        address creator;
        OrderType orderType;
    }

    struct Pair {
        address first_token_addr;
        address second_token_addr;
        uint first_token_decimals;
        uint second_token_decimals;
    }
}