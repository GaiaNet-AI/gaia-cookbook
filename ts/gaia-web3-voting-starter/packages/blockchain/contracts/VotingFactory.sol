// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./VotingBase.sol";

/**
 * @title VotingFactory
 * @dev Factory contract for creating new voting instances
 */
contract VotingFactory {
    // Array to store all created votings
    address[] public deployedVotings;

    // Mapping from voting address to creator
    mapping(address => address) public votingToCreator;

    // Events
    event VotingCreated(
        address votingAddress,
        string description,
        address creator
    );

    // Predefined durations (in minutes)
    uint256 public constant DURATION_5_MIN = 5;
    uint256 public constant DURATION_30_MIN = 30;
    uint256 public constant DURATION_1_DAY = 1440; // 24 * 60
    uint256 public constant DURATION_1_WEEK = 10080; // 7 * 24 * 60

    /**
     * @dev Function to create a new voting
     * @param _description Description/name of the voting scenario
     * @param _optionNames Array of option names
     * @param _durationInMinutes Duration of voting period in minutes
     * @return Address of the newly created voting contract
     */
    function createVoting(
        string memory _description,
        string[] memory _optionNames,
        uint256 _durationInMinutes
    ) public returns (address) {
        // Create a new voting instance
        VotingBase newVoting = new VotingBase(
            _description,
            _optionNames,
            _durationInMinutes,
            msg.sender
        );

        // Add the new voting to the list
        address votingAddress = address(newVoting);
        deployedVotings.push(votingAddress);

        // Map voting to creator
        votingToCreator[votingAddress] = msg.sender;

        // Emit event
        emit VotingCreated(votingAddress, _description, msg.sender);

        return votingAddress;
    }

    /**
     * @dev Function to create a voting with a predefined duration
     * @param _description Description/name of the voting scenario
     * @param _optionNames Array of option names
     * @param _durationType Type of duration (1=5min, 2=30min, 3=1day, 4=1week)
     * @return Address of the newly created voting contract
     */
    function createVotingWithPredefinedDuration(
        string memory _description,
        string[] memory _optionNames,
        uint8 _durationType
    ) public returns (address) {
        uint256 duration;

        if (_durationType == 1) {
            duration = DURATION_5_MIN;
        } else if (_durationType == 2) {
            duration = DURATION_30_MIN;
        } else if (_durationType == 3) {
            duration = DURATION_1_DAY;
        } else if (_durationType == 4) {
            duration = DURATION_1_WEEK;
        } else {
            revert("Invalid duration type");
        }

        return createVoting(_description, _optionNames, duration);
    }

    /**
     * @dev Function to get all deployed votings
     * @return Array of all voting contract addresses
     */
    function getDeployedVotings() public view returns (address[] memory) {
        return deployedVotings;
    }

    /**
     * @dev Function to get the number of votings created
     * @return Number of votings
     */
    function getVotingCount() public view returns (uint256) {
        return deployedVotings.length;
    }

    /**
     * @dev Function to get all votings created by a specific address
     * @param _creator Address of the creator
     * @return Array of voting addresses created by the specified creator
     */
    function getVotingsByCreator(
        address _creator
    ) public view returns (address[] memory) {
        // First, count how many votings were created by this creator
        uint256 count = 0;
        for (uint256 i = 0; i < deployedVotings.length; i++) {
            if (votingToCreator[deployedVotings[i]] == _creator) {
                count++;
            }
        }

        // Now create and populate the result array
        address[] memory result = new address[](count);
        uint256 resultIndex = 0;

        for (uint256 i = 0; i < deployedVotings.length; i++) {
            if (votingToCreator[deployedVotings[i]] == _creator) {
                result[resultIndex] = deployedVotings[i];
                resultIndex++;
            }
        }

        return result;
    }
}
