export const MEME_COIN_CONTRACT = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract {TOKEN_NAME}Token is ERC20, Ownable {
    uint256 public constant TOTAL_SUPPLY = {TOTAL_SUPPLY} * 10**18;
    uint256 public constant MAX_TRANSACTION_AMOUNT = TOTAL_SUPPLY / 100;
    uint256 public constant MAX_WALLET_AMOUNT = TOTAL_SUPPLY / 50;
    
    mapping(address => bool) public isExcludedFromLimits;
    
    constructor() ERC20("{TOKEN_NAME}", "{TOKEN_SYMBOL}") {
        // First exclude deployer from limits, then mint
        isExcludedFromLimits[msg.sender] = true;
        isExcludedFromLimits[address(this)] = true;
        
        // Now mint full supply
        _mint(msg.sender, TOTAL_SUPPLY);
    }
    
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        // Skip checks during initial mint
        if (from == address(0)) {
            super._beforeTokenTransfer(from, to, amount);
            return;
        }
        
        // Normal transfer checks
        require(
            amount <= MAX_TRANSACTION_AMOUNT || 
            isExcludedFromLimits[from] || 
            isExcludedFromLimits[to],
            "Transfer amount exceeds maximum"
        );
        
        if (to != address(0)) {
            uint256 recipientBalance = balanceOf(to);
            require(
                recipientBalance + amount <= MAX_WALLET_AMOUNT || 
                isExcludedFromLimits[to],
                "Recipient wallet amount exceeds maximum"
            );
        }
        
        super._beforeTokenTransfer(from, to, amount);
    }
    
    function excludeFromLimits(address account) external onlyOwner {
        isExcludedFromLimits[account] = true;
    }
    
    function includeInLimits(address account) external onlyOwner {
        isExcludedFromLimits[account] = false;
    }
}`;