const getBlockchainEnum = () => [
    "arbitrum", "avalanche", "base", "bsc", "eth", "fantom", "flare",
    "gnosis", "linea", "optimism", "polygon", "polygon_zkevm", "rollux",
    "scroll", "stellar", "story_mainnet", "syscoin", "telos", "xai", "xlayer",
    "avalanche_fuji", "base_sepolia", "eth_holesky", "eth_sepolia",
    "optimism_testnet", "polygon_amoy", "story_aeneid_testnet"
];

// Helper for optional pagination parameters
const paginationParams = {
    pageSize: { type: "integer", description: "Optional. Number of results per page." },
    pageToken: { type: "string", description: "Optional. Page token for pagination." }
};

// Helper for optional time/block range parameters
const rangeParams = {
    fromBlock: { type: "integer", description: "Optional. Start block number." },
    toBlock: { type: "integer", description: "Optional. End block number." },
    fromTimestamp: { type: "integer", description: "Optional. Start Unix timestamp." },
    toTimestamp: { type: "integer", description: "Optional. End Unix timestamp." }
};


const ankrTools = [
    {
        type: "function",
        function: {
            name: "ankr_getBlockchainStats",
            description: "Retrieves statistics for one or more specified blockchains. If no blockchain is specified, stats for all available chains are returned.",
            parameters: {
                type: "object",
                properties: {
                    blockchain: {
                        type: "string", // API supports string, array, or empty. Tool simplified to string or empty.
                        description: "Optional. The blockchain identifier (e.g., 'eth', 'bsc'). Leave empty for all chains.",
                        enum: getBlockchainEnum()
                    }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "ankr_getBlocks",
            description: "Retrieves detailed block data for a specified range on a given blockchain.",
            parameters: {
                type: "object",
                properties: {
                    blockchain: { type: "string", description: "The blockchain identifier (e.g., 'eth').", enum: getBlockchainEnum() },
                    fromBlock: { type: "integer", description: "The first block number of the range (decimal)." },
                    toBlock: { type: "integer", description: "The last block number of the range (decimal)." },
                    decodeLogs: { type: "boolean", description: "Optional. Set to true to decode logs. Defaults to false." },
                    decodeTxData: { type: "boolean", description: "Optional. Set to true to decode transaction data. Defaults to false." },
                    descOrder: { type: "boolean", description: "Optional. Set to true for descending order. Defaults to false (ascending)." },
                    includeLogs: { type: "boolean", description: "Optional. Set to true to include logs (requires includeTxs=true). Defaults to false." },
                    includeTxs: { type: "boolean", description: "Optional. Set to true to include transactions. Defaults to false." }
                },
                required: ["blockchain", "fromBlock", "toBlock"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "ankr_getLogs",
            description: "Retrieves historical log data for a specified range of blocks, optionally filtered by address and topics.",
            parameters: {
                type: "object",
                properties: {
                    blockchain: { type: "string", description: "The blockchain identifier (e.g., 'eth'). Can also be a comma-separated list for multiple chains for the LLM, to be split into an array by the calling function.", enum: getBlockchainEnum() },
                    address: { type: "array", items: { type: "string" }, description: "Optional. A contract address or a list of addresses (hex format) from which the logs originate." },
                    ...rangeParams,
                    topics: { type: "array", items: { type: "array", items: { type: "string" } }, description: "Optional. Array of arrays of topics to filter by (e.g., [[\"topic0_0\"], [\"topic1_0\", \"topic1_1\"]])." },
                    decodeLogs: { type: "boolean", description: "Optional. Set to true to decode logs. Defaults to false." },
                    descOrder: { type: "boolean", description: "Optional. Set to true for descending order. Defaults to false (ascending)." },
                    ...paginationParams
                },
                required: ["blockchain"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "ankr_getTransactionsByHash",
            description: "Retrieves the details of a transaction specified by its hash, optionally on a given blockchain.",
            parameters: {
                type: "object",
                properties: {
                    transactionHash: { type: "string", description: "The transaction hash." },
                    blockchain: { type: "string", description: "Optional. The blockchain identifier (e.g., 'eth'). If omitted, Ankr might search across chains or default.", enum: getBlockchainEnum() },
                    decodeLogs: { type: "boolean", description: "Optional. Set to true to decode logs. Defaults to false." },
                    decodeTxData: { type: "boolean", description: "Optional. Set to true to decode transaction data. Defaults to false." },
                    includeLogs: { type: "boolean", description: "Optional. Set to true to include logs. Defaults to false." }
                },
                required: ["transactionHash"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "ankr_getTransactionsByAddress",
            description: "Retrieves transactions involving a specific address, optionally on a given blockchain and with filters.",
            parameters: {
                type: "object",
                properties: {
                    address: { type: "string", description: "The address (wallet or contract) to query transactions for." },
                    blockchain: { type: "string", description: "Optional. The blockchain identifier (e.g., 'eth'). If omitted, Ankr might search across chains or default. Can also be a comma-separated list for the LLM.", enum: getBlockchainEnum() },
                    ...rangeParams,
                    includeLogs: { type: "boolean", description: "Optional. Set to true to include logs. Defaults to false." },
                    descOrder: { type: "boolean", description: "Optional. Set to true for descending order. Defaults to false (ascending)." },
                    ...paginationParams
                },
                required: ["address"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "ankr_getInteractions",
            description: "Retrieves a list of blockchains with which a particular wallet address has interacted.",
            parameters: {
                type: "object",
                properties: {
                    address: { type: "string", description: "The wallet address." }
                },
                required: ["address"]
            }
        }
    },

    // --- NFT API Methods ---
    {
        type: "function",
        function: {
            name: "ankr_getNFTsByOwner",
            description: "Retrieves NFTs (ERC721/ERC1155/ENS/POAP) belonging to a specific wallet address, optionally filtered by blockchain or contract.",
            parameters: {
                type: "object",
                properties: {
                    walletAddress: { type: "string", description: "The account address (or ENS name) to query for NFTs." },
                    blockchain: {
                        type: "string", // API takes string or array. For LLM, can be comma-separated.
                        description: "Optional. Blockchain(s) to query (e.g., 'eth', 'polygon,bsc'). Leave empty for all.",
                        enum: getBlockchainEnum()
                    },
                    ...paginationParams,
                    filter: {
                        type: "array",
                        description: "Optional. Filter by contract address(es) and optionally token ID(s). E.g., [{'0xcontract1': []}, {'0xcontract2': ['tokenId1']}]",
                        items: {
                            type: "object",
                            additionalProperties: {
                                type: "array",
                                items: { type: "string" }
                            }
                        }
                    }
                },
                required: ["walletAddress"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "ankr_getNFTMetadata",
            description: "Retrieves metadata for a specific NFT (ERC721/ERC1155/ENS/POAP).",
            parameters: {
                type: "object",
                properties: {
                    contractAddress: { type: "string", description: "The NFT contract address (or ENS name)." },
                    tokenId: { type: "string", description: "The token ID of the NFT." }, // API says integer, but string is safer for LLM and large IDs
                    blockchain: { type: "string", description: "The blockchain identifier.", enum: getBlockchainEnum() },
                    forceFetch: { type: "boolean", description: "Optional. True to fetch from contract, false from database. Default false." },
                    skipSyncCheck: { type: "boolean", description: "Optional. True to return info regardless of indexer health. Default false." }
                },
                required: ["contractAddress", "tokenId", "blockchain"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "ankr_getNFTHolders",
            description: "Retrieves a list of wallet addresses holding a specific NFT collection.",
            parameters: {
                type: "object",
                properties: {
                    contractAddress: { type: "string", description: "The NFT collection's contract address (or ENS name)." },
                    blockchain: { type: "string", description: "The blockchain identifier.", enum: getBlockchainEnum() },
                    ...paginationParams
                },
                required: ["contractAddress", "blockchain"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "ankr_getNftTransfers",
            description: "Retrieves NFT transfer history for a specific address or list of addresses.",
            parameters: {
                type: "object",
                properties: {
                    address: {
                        type: "array", // API takes array of strings
                        items: { type: "string" },
                        description: "An address or list of addresses to search for NFT transfers."
                    },
                    blockchain: {
                        type: "string", // API takes array of strings. LLM can provide comma-separated.
                        description: "Optional. Blockchain(s) to query (e.g., 'eth', 'bsc,polygon'). Leave empty for all.",
                        enum: getBlockchainEnum()
                    },
                    ...rangeParams,
                    descOrder: { type: "boolean", description: "Optional. True for descending order. Default false." },
                    ...paginationParams
                },
                required: ["address"]
            }
        }
    },

    // --- Token API Methods ---
    {
        type: "function",
        function: {
            name: "ankr_getAccountBalance",
            description: "Retrieves the native and token balances for a specific wallet address.",
            parameters: {
                type: "object",
                properties: {
                    walletAddress: { type: "string", description: "The account address (or ENS name) to query for balance." },
                    blockchain: {
                        type: "string", // API takes string or array. For LLM, can be comma-separated.
                        description: "Optional. Blockchain(s) to query (e.g., 'eth', 'polygon,bsc'). Leave empty for all.",
                        enum: getBlockchainEnum()
                    },
                    nativeFirst: { type: "boolean", description: "Optional. Sort native token first. Default unspecified." },
                    onlyWhitelisted: { type: "boolean", description: "Optional. True to show only CoinGecko listed tokens. Default true." },
                    ...paginationParams
                },
                required: ["walletAddress"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "ankr_getCurrencies",
            description: "Retrieves a list of currencies available on a specific blockchain.",
            parameters: {
                type: "object",
                properties: {
                    blockchain: { type: "string", description: "The blockchain identifier.", enum: getBlockchainEnum() }
                },
                required: ["blockchain"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "ankr_getTokenPrice",
            description: "Retrieves the USD price of a specific token or the native coin of a blockchain.",
            parameters: {
                type: "object",
                properties: {
                    blockchain: { type: "string", description: "The blockchain identifier.", enum: getBlockchainEnum() },
                    contractAddress: { type: "string", description: "Optional. The token contract address (or ENS name). If omitted, returns native coin price." }
                },
                required: ["blockchain"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "ankr_getTokenHolders",
            description: "Retrieves a list of holders for a specific fungible token contract.",
            parameters: {
                type: "object",
                properties: {
                    contractAddress: { type: "string", description: "The token contract address (or ENS name)." },
                    blockchain: { type: "string", description: "The blockchain identifier.", enum: getBlockchainEnum() },
                    ...paginationParams
                },
                required: ["contractAddress", "blockchain"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "ankr_getTokenHoldersCount",
            description: "Retrieves the number of holders for a specific fungible token contract.",
            parameters: {
                type: "object",
                properties: {
                    contractAddress: { type: "string", description: "The token contract address (or ENS name)." },
                    blockchain: { type: "string", description: "The blockchain identifier.", enum: getBlockchainEnum() },
                    // Note: API doc shows pageSize/pageToken for this, which is unusual for a count. Included as per doc.
                    ...paginationParams
                },
                required: ["contractAddress", "blockchain"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "ankr_getTokenTransfers",
            description: "Retrieves token transfer history for a specific address or list of addresses.",
            parameters: {
                type: "object",
                properties: {
                    address: {
                        type: "array", // API takes array of strings
                        items: { type: "string" },
                        description: "An address or list of addresses to search for token transfers."
                    },
                    blockchain: {
                        type: "string", // API takes string or array. For LLM, can be comma-separated.
                        description: "Optional. Blockchain(s) to query (e.g., 'eth', 'bsc,polygon'). Leave empty for all.",
                        enum: getBlockchainEnum()
                    },
                    ...rangeParams,
                    descOrder: { type: "boolean", description: "Optional. True for descending order. Default false." },
                    ...paginationParams
                },
                required: ["address"]
            }
        }
    }
];

module.exports = { ankrTools };