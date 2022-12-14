// SPDX-License-Identifier: none
pragma solidity ^0.8.17;

interface IDEXStructs {
    enum OrderType{BUY, SELL}

    struct Order {
        uint id;
        string pair_name;
        uint amount;
        uint price;
        address creator;
        OrderType orderType;
    }

    struct Pair {
        address first_token_addr;
        address second_token_addr;
        uint price_decimals;
    }
}