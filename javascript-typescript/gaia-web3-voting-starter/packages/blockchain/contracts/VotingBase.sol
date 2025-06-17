// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title VotingBase
 * @dev Base contract for a single voting scenario with multiple options
 */
contract VotingBase {
    // Define a struct to represent a voting option
    struct Option {
        string name;
        uint256 voteCount;
    }

    // Array to store all options
    Option[] public options;

    // Description/name of the voting scenario
    string public description;

    // Address of the contract creator (who cannot vote)
    address public creator;

    // Mapping to keep track of voters
    mapping(address => bool) public voters;

    // Timestamps for voting period
    uint256 public votingStart;
    uint256 public votingEnd;

    // Events for logging
    event VoteCast(address indexed voter, uint256 optionIndex);
    event OptionAdded(string name);

    /**
     * @dev Constructor to initialize the base contract
     * @param _description Description/name of the voting scenario
     * @param _optionNames Array of option names
     * @param _durationInMinutes Duration of voting period in minutes
     * @param _creator Address of the voting creator
     */
    constructor(
        string memory _description,
        string[] memory _optionNames,
        uint256 _durationInMinutes,
        address _creator
    ) {
        require(_optionNames.length >= 2, "Must have at least 2 options");

        // Set the description
        description = _description;

        // Add initial options to the array
        for (uint256 i = 0; i < _optionNames.length; i++) {
            options.push(Option({name: _optionNames[i], voteCount: 0}));
            emit OptionAdded(_optionNames[i]);
        }

        // Set the contract creator
        creator = _creator;

        // Set voting period start and end times
        votingStart = block.timestamp;
        votingEnd = block.timestamp + (_durationInMinutes * 1 minutes);
    }

    // Modifier to check if voting is active
    modifier votingActive() {
        require(
            block.timestamp >= votingStart && block.timestamp < votingEnd,
            "Voting is not active"
        );
        _;
    }

    // Modifier to prevent creator from voting
    modifier notCreator() {
        require(msg.sender != creator, "Creator cannot vote");
        _;
    }

    /**
     * @dev Function for voters to cast their vote
     * @param _optionIndex Index of the option to vote for
     */
    function vote(uint256 _optionIndex) public votingActive notCreator {
        // Check if the voter hasn't voted before
        require(!voters[msg.sender], "You have already voted");

        // Check if the option index is valid
        require(_optionIndex < options.length, "Invalid option index");

        // Increment the vote count for the chosen option
        options[_optionIndex].voteCount++;

        // Mark the voter as having voted
        voters[msg.sender] = true;

        // Emit event
        emit VoteCast(msg.sender, _optionIndex);
    }

    /**
     * @dev Function to get all options and their vote counts
     * @return Array of options with their vote counts
     */
    function getAllOptions() public view returns (Option[] memory) {
        return options;
    }

    /**
     * @dev Function to get the number of options
     * @return Number of options
     */
    function getOptionCount() public view returns (uint256) {
        return options.length;
    }

    /**
     * @dev Function to check if voting is currently active
     * @return Boolean indicating whether voting is active
     */
    function isVotingActive() public view returns (bool) {
        return (block.timestamp >= votingStart && block.timestamp < votingEnd);
    }

    /**
     * @dev Function to get the remaining time for voting
     * @return Remaining time in seconds
     */
    function getRemainingTime() public view returns (uint256) {
        if (block.timestamp < votingStart) {
            return votingEnd - votingStart; // Voting hasn't started yet
        }

        if (block.timestamp >= votingEnd) {
            return 0; // Voting has ended
        }

        return votingEnd - block.timestamp; // Voting is active
    }

    /**
     * @dev Function to check if a user has voted
     * @param _voter Address of the voter to check
     * @return Boolean indicating whether the user has voted
     */
    function hasVoted(address _voter) public view returns (bool) {
        return voters[_voter];
    }

    /**
     * @dev Function to get the winning option
     * @return winningIndex Index of the winning option
     * @return winningName Name of the winning option
     * @return winningVotes Number of votes for the winning option
     */
    function getWinner()
        public
        view
        returns (
            uint256 winningIndex,
            string memory winningName,
            uint256 winningVotes
        )
    {
        require(options.length > 0, "No options available");

        uint256 winningVoteCount = 0;
        uint256 winnerIndex = 0;

        for (uint256 i = 0; i < options.length; i++) {
            if (options[i].voteCount > winningVoteCount) {
                winningVoteCount = options[i].voteCount;
                winnerIndex = i;
            }
        }

        return (
            winnerIndex,
            options[winnerIndex].name,
            options[winnerIndex].voteCount
        );
    }
}
