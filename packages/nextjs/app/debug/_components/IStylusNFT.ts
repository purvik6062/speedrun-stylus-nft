export const IStylusNFT = [
  // ERC721 Standard Interface
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 token_id) view returns (address)",
  "function safeTransferFrom(address from, address to, uint256 token_id, bytes data)",
  "function safeTransferFrom(address from, address to, uint256 token_id)",
  "function transferFrom(address from, address to, uint256 token_id)",
  "function approve(address approved, uint256 token_id)",
  "function setApprovalForAll(address operator, bool approved)",
  "function getApproved(uint256 token_id) view returns (address)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",

  // StylusNFT Specific Functions
  "function mint() returns ()",
  "function mintTo(address to) returns ()",
  "function safeMint(address to) returns ()",
  "function safeMint(bytes data) returns ()",
  "function burn(uint256 token_id) returns ()",
  "function initialize(address art_contract_address, address erc20_token_contract_address) returns ()",
  "function getArtContractAddress() view returns (address)",

  // Events
  "event Transfer(address indexed from, address indexed to, uint256 indexed token_id)",
  "event Approval(address indexed owner, address indexed approved, uint256 indexed token_id)",
  "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",

  // Errors
  "error AlreadyInitialized()",
  "error NotEnoughERC20Balance(uint256 balance, uint256 expected)",
  "error ExternalCallFailed()",
];
