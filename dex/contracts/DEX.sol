// SPDX-License-Identifier: none
pragma solidity ^0.8.17;

import "./interfaces/IDEX.sol";
import "./interfaces/IAccount.sol";
import "./libraries/ArrayLib.sol";
import "openzeppelin-contracts/utils/EnumerableSet.sol";
import "openzeppelin-contracts/access/Ownable.sol";
import "openzeppelin-contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-contracts/math/Math.sol";

contract DEX is IDEX, IAccount, Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;
    using ArrayLib for string[];
    using SafeERC20 for IERC20;

    EnumerableSet.AddressSet private tokens;

    mapping (string => Pair) private Pairs;
    string[] private PairsList;

    mapping (string => mapping (OrderType => Order[])) private PairOrders;

    uint private last_order_id;

    // balances
    mapping (address => mapping (address => uint)) private overallBalances; // token => user => uint
    mapping (address => mapping (address => uint)) private lockedBalances; // token => user => uint

    // events
    event PairAdded(string pair);
    event PairDeleted(string pair);
    event NewBuyOrder(uint id, string pair, address user, uint amount, uint price);
    event NewSellOrder(uint id, string pair, address user, uint amount, uint price);
    event OrderCompleted(uint id, string pair, address buyer, address seller, uint amount, uint price);
    event MarketOrderRemainder(address creator, uint remained_amount, OrderType orderType);

    // modifiers
    modifier onlyCreator(Order storage order) {
        require(msg.sender == order.creator);
        _;
    }

    modifier pairExists(string calldata pair_name) {
        require(Pairs[pair_name].first_token_addr != address(0), "Pair doesn't exist");
        _;
    }

    modifier tokenExists(address token) {
        require(tokens.contains(token), "Token isn't supported");
        _;
    }

    // owner functions
    function addPair(string calldata pair_name,
                     address first_token_addr, 
                     address second_token_addr, 
                     uint price_decimals) external onlyOwner {
        require(Pairs[pair_name].first_token_addr == address(0), "Pair exists");
        tokens.add(first_token_addr);
        tokens.add(second_token_addr);
        Pair memory p = Pair({first_token_addr: first_token_addr, 
                        second_token_addr: second_token_addr,
                        price_decimals: price_decimals});
        Pairs[pair_name] = p;
        PairsList.push(pair_name);
        emit PairAdded(pair_name);
    }

    function deletePair(string calldata pair_name) external onlyOwner pairExists(pair_name) {
        Pair storage p = Pairs[pair_name];
        tokens.remove(p.first_token_addr);
        tokens.remove(p.second_token_addr);
        PairsList.remove(pair_name);
        delete PairOrders[pair_name][OrderType.BUY];
        delete PairOrders[pair_name][OrderType.SELL];
        delete Pairs[pair_name];
        emit PairDeleted(pair_name);
    }


    // view functions
    function fetchPairs() external view returns(string[] memory) {
        return PairsList;
    }

    function getPair(string calldata pair_name) external view returns(Pair memory) {
        return Pairs[pair_name];
    }

    function balanceOf(address token, address user) external view returns(uint) {
        return _countBalance(token, user);
    }

    function fetchBuyOrders(string calldata pair_name) external view returns(Order[] memory) {
        return PairOrders[pair_name][OrderType.BUY];
    }

    function fetchSellOrders(string calldata pair_name) external view returns(Order[] memory) {
        return PairOrders[pair_name][OrderType.SELL];
    }

    //function fetchUserOrders(string calldata pair_name) external view returns(Order[] memory);


    // user functions
    function deposit(address token, uint amount) external tokenExists(token) {
        overallBalances[token][msg.sender] += amount;
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }

    function withdraw(address token, uint amount) external tokenExists(token) {
        require(_countBalance(token, msg.sender) >= amount, "Insufficient unlocked balance");
        overallBalances[token][msg.sender] -= amount;
        IERC20(token).safeTransfer(msg.sender, amount);
    }

    function buyOrderMarket(string calldata pair_name, uint amount) external pairExists(pair_name){
        Order[] storage orderList = PairOrders[pair_name][OrderType.SELL];
        uint ordersLength = orderList.length;
        require(ordersLength != 0, "No sell orders");

        Pair storage p = Pairs[pair_name];
        uint remainingAmount = amount;
        while (remainingAmount != 0 && ordersLength != 0) {
            Order storage o = orderList[ordersLength - 1];
            uint amount_ = Math.min(o.amount, remainingAmount);
            uint buyerPrice = (amount_ * o.price) / (10 ** p.price_decimals);
            require(_countBalance(p.second_token_addr, msg.sender) >= amount_, "Insufficient unlocked balance");

            remainingAmount -= amount_;
            overallBalances[p.first_token_addr][msg.sender] += amount_;
            overallBalances[p.second_token_addr][msg.sender] -= buyerPrice;
            
            overallBalances[p.first_token_addr][o.creator] -= amount_;
            lockedBalances[p.first_token_addr][o.creator] -= amount_;
            overallBalances[p.second_token_addr][o.creator] += buyerPrice;

            emit OrderCompleted(o.id, pair_name, msg.sender, o.creator, amount_, o.price);

            orderList.pop();
            ordersLength--;
        }

        if (remainingAmount != 0) {
            emit MarketOrderRemainder(msg.sender, remainingAmount, OrderType.BUY);
        }
    }

    function buyOrderLimit(string calldata pair_name, uint amount, uint price) external pairExists(pair_name){
        Pair storage p = Pairs[pair_name];
        uint spentAmount = (amount * price) / (10 ** p.price_decimals);
        require(_countBalance(p.second_token_addr, msg.sender) >= spentAmount, "Insufficient unlocked balance");
        lockedBalances[p.second_token_addr][msg.sender] += spentAmount;
        last_order_id++;
        Order[] storage orderList = PairOrders[pair_name][OrderType.BUY];
        orderList.push(Order({
            id: last_order_id,
            pair_name: pair_name,
            amount: amount,
            price: price,
            creator: msg.sender,
            orderType: OrderType.BUY
        }));

        unchecked {
            for (uint i = orderList.length; i > 1; --i) {
                if (orderList[i-1].price > orderList[i-2].price)
                    break;
                
                // swap orders
                Order memory tmp = orderList[i-1];
                orderList[i-1] = orderList[i-2];
                orderList[i-2] = tmp;
            }
        }
        emit NewBuyOrder(last_order_id, pair_name, msg.sender, amount, price);
    }

    function sellOrderMarket(string calldata pair_name, uint amount) external pairExists(pair_name){
        Order[] storage orderList = PairOrders[pair_name][OrderType.BUY];
        uint ordersLength = orderList.length;
        require(ordersLength != 0, "No buy orders");

        Pair storage p = Pairs[pair_name];
        uint remainingAmount = amount;
        while (remainingAmount != 0 && ordersLength != 0) {
            Order storage o = orderList[ordersLength - 1];
            uint amount_ = Math.min(o.amount, remainingAmount);
            uint sellerPrice = (amount_ * o.price) / (10 ** p.price_decimals);
            require(_countBalance(p.first_token_addr, msg.sender) >= amount_, "Insufficient unlocked balance");

            remainingAmount -= amount_;
            overallBalances[p.second_token_addr][msg.sender] += amount_;
            overallBalances[p.first_token_addr][msg.sender] -= sellerPrice;
            
            overallBalances[p.second_token_addr][o.creator] -= amount_;
            lockedBalances[p.second_token_addr][o.creator] -= amount_;
            overallBalances[p.first_token_addr][o.creator] += sellerPrice;

            emit OrderCompleted(o.id, pair_name, o.creator, msg.sender, amount_, o.price);

            orderList.pop();
            ordersLength--;
        }

        if (remainingAmount != 0) {
            emit MarketOrderRemainder(msg.sender, remainingAmount, OrderType.SELL);
        }
    }

    function sellOrderLimit(string calldata pair_name, uint amount, uint price) external pairExists(pair_name){
        Pair storage p = Pairs[pair_name];
        require(_countBalance(p.first_token_addr, msg.sender) >= amount, "Insufficient unlocked balance");
        lockedBalances[p.first_token_addr][msg.sender] += amount;
        last_order_id++;
        Order[] storage orderList = PairOrders[pair_name][OrderType.SELL];
        orderList.push(Order({
            id: last_order_id,
            pair_name: pair_name,
            amount: amount,
            price: price,
            creator: msg.sender,
            orderType: OrderType.SELL
        }));

        unchecked {
            for (uint i = orderList.length; i > 1; --i) {
                if (orderList[i-1].price < orderList[i-2].price)
                    break;
                
                // swap orders
                Order memory tmp = orderList[i-1];
                orderList[i-1] = orderList[i-2];
                orderList[i-2] = tmp;
            }
        }
        emit NewSellOrder(last_order_id, pair_name, msg.sender, amount, price);
    }

    function deleteOrder(uint id) external {

    }


    // internal
    function _countBalance(address token, address user) internal view returns(uint) {
        return overallBalances[token][user] - lockedBalances[token][user];
    }
}