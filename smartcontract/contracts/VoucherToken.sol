pragma solidity >=0.4.21 <0.6.0;

import "./ecrecovery.sol";

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract VoucherToken is ERC20, ERC20Detailed {
  using SafeMath for uint256;

  address public baseTokenAddress = address(0);
  address public poolAddress = address(0);

  uint256 public maxPrice = 99e10; 
  uint256 public midPrice = 98e10;
  uint256 public minPrice = 97e10;
  uint256 public sponsorTransferFee = 1000e18;
  uint256 public sponsorTransferFeeInBaseToken = 98e13;

  mapping(address => uint256) public userNonce;
  
  constructor() ERC20Detailed("Voucher IDR", "VIDR", 0) public {
  }

  function setup(address _baseTokenAddress,address _poolAddress) public {
    require(baseTokenAddress == address(0),"already connected");
    baseTokenAddress = _baseTokenAddress;
    poolAddress = _poolAddress;
  }

  function isNonceAvailable(address user,uint256 nonce) public view returns (bool) {
    return (userNonce[user] < nonce);
  }

  function signatureToAddress(
    bytes32 message,
    bytes memory sig
  ) public pure returns (address) {
    return ECRecovery.recover(
      ECRecovery.toEthSignedMessageHash(message),
      sig
    );
  }

  function hashSponsoredTransfer(
    uint256 nonce,
    address from,
    address to,
    uint256 amount,
    uint256 fee,
    bytes32 data
  ) public pure returns (bytes32) {
    return
      keccak256(
        abi.encodePacked(
          "sponsoredTransfer",
          nonce,
          from,
          to,
          amount,
          fee,
          data)
      );
  }

  function checkSponsoredTransferRequirement(bytes memory sigSender,
    uint256 nonce,
    address from,
    address to,
    uint256 amount,
    uint256 fee,
    bytes32 data
  ) public view returns (uint8) {
    if(fee < sponsorTransferFee) return 1;
    bytes32 h = hashSponsoredTransfer(
      nonce,
      from,
      to,
      amount,
      fee,
      data
    );
    address user = signatureToAddress(h, sigSender);
    if(user != from) return 2;
    if(nonce <= userNonce[user]) return 3;
    return 0;
  }

  function sponsoredTransfer(
    bytes memory sigSender,
    uint256 nonce,
    address from,
    address to,
    uint256 amount,
    uint256 fee,
    bytes32 data) public {
    
    uint8 ok = checkSponsoredTransferRequirement(
      sigSender,
      nonce,
      from,
      to,
      amount,
      fee,
      data
    );

    require(ok == 0,"not enough requirement");
    
    userNonce[from] = nonce;
    uint256 senderFee = fee.sub(sponsorTransferFee);
    if(senderFee > 0) _transfer(from,_msgSender(),senderFee);
    _burn(from,sponsorTransferFee);
    IERC20(baseTokenAddress).transfer(poolAddress,sponsorTransferFeeInBaseToken);
    _transfer(from,to,amount);
  }

  function generateVoucherPrice(uint256 amountCoin) public view returns (uint256,uint256) {
    uint256 totalMaxPrice = amountCoin.mul(maxPrice).div(1e18); // RUPE
    uint256 totalMidPrice = amountCoin.mul(midPrice).div(1e18); // RUPE
    uint256 totalToPool = totalMaxPrice.sub(totalMidPrice);     // RUPE
    return (totalMaxPrice,totalToPool);
  }

  function redeemVoucherPrice(uint256 amountCoin) public view returns (uint256,uint256) {
    uint256 totalMidPrice = amountCoin.mul(midPrice).div(1e18); // RUPE           
    uint256 totalMinPrice = amountCoin.mul(minPrice).div(1e18); // RUPE
    uint256 totalToPool = totalMidPrice.sub(totalMinPrice);     // RUPE
    return (totalMinPrice,totalToPool);
  }

  function generateVoucher(address to, uint256 amountCoin) public {
    require(amountCoin >= 1e18,"amount buy lt 1");
    (uint256 totalMaxPrice, uint256 totalToPool) = generateVoucherPrice(amountCoin);
    IERC20(baseTokenAddress).transferFrom(msg.sender,address(this),totalMaxPrice);
    IERC20(baseTokenAddress).transfer(poolAddress,totalToPool);
    _mint(to,amountCoin);
  }

  function redeemVoucher(uint256 amountCoin) public {
    require(amountCoin >= 1e18,"amount sell lt 1");
    (uint256 totalMinPrice, uint256 totalToPool) = redeemVoucherPrice(amountCoin);
    _burn(msg.sender,amountCoin);
    IERC20(baseTokenAddress).transfer(poolAddress,totalToPool);
    IERC20(baseTokenAddress).transfer(msg.sender,totalMinPrice);
  }

}
