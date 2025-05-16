// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MemeToken is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        // Mint the initial supply to the contract deployer, scaled by decimals
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    // Explicitly define the decimals to avoid any potential overrides
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
