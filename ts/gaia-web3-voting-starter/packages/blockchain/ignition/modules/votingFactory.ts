// This script deploys the VotingFactory and VotingBase contracts using Hardhat Ignition
// Learn more at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VotingModule = buildModule("VotingModule", (m) => {
  // Deploy the VotingFactory contract
  // This automatically handles the VotingBase deployment when needed
  const votingFactory = m.contract("VotingFactory", []);

  // Optional: If you want to create an initial voting instance during deployment
  // Uncomment and customize the following section

  /*
  // Default values for initial voting instance
  const DEFAULT_DESCRIPTION = "Example Voting";
  const DEFAULT_OPTIONS = ["Option 1", "Option 2", "Option 3"];
  const DEFAULT_DURATION_TYPE = 3; // 1=5min, 2=30min, 3=1day, 4=1week

  // Define parameters with default values
  const description = m.getParameter("description", DEFAULT_DESCRIPTION);
  const options = m.getParameter("options", DEFAULT_OPTIONS);
  const durationType = m.getParameter("durationType", DEFAULT_DURATION_TYPE);

  // Create an initial voting instance using the factory
  const initialVotingTx = m.invoke(
    "createInitialVoting",
    votingFactory,
    "createVotingWithPredefinedDuration",
    [description, options, durationType]
  );
  */

  return { 
    votingFactory,
    // Uncomment if using the initial voting creation
    // initialVotingTx
  };
});

export default VotingModule;