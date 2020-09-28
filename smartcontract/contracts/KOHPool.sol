pragma solidity >=0.4.21 <0.6.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract KOHPool is ERC20, ERC20Detailed, Ownable {
  using SafeMath for uint256;

  address stableCoinAddress;
  uint256 contractBalance;
  
  constructor(address _stableCoinAddress) ERC20Detailed("Kings Of Harmony Pool", "KING", 18) public {
    stableCoinAddress = _stableCoinAddress;
  }

  function getContractBalance() public view returns (uint256) {
    return (contractBalance);
  }

  function sellPrice(uint256 amountShare) public view returns (uint256,uint256) {
    uint256 midPrice = getMidPrice();
    uint256 minPrice = amountShare.mul(midPrice).div(1e18);

    uint256 stableCoinLocked = IERC20(stableCoinAddress).balanceOf(address(this));
    uint256 stableCoinShare = 0;
    uint256 totalShare = totalSupply();
    if( totalShare > 0 ) stableCoinShare = stableCoinLocked.mul(amountShare).div(totalShare);

    return (minPrice,stableCoinShare);
  }

  function buyPrice(uint256 amountShare) public view returns (uint256,uint256) {
    (uint256 minPrice,) = sellPrice(amountShare);
    uint256 maxPrice = minPrice.mul(130).div(100);
    uint256 toDev = (maxPrice.sub(minPrice)).div(2);
    return (maxPrice,toDev);
  }

  function amountShareForPrice(uint256 price) public view returns (uint256,uint256,uint256) {
    (uint256 priceSingleShare,) = buyPrice(1e18);
    uint256 amountShare = price.div(priceSingleShare).mul(1e18);
    (uint256 realPrice,uint256 toDev) = buyPrice(amountShare);
    return (amountShare,realPrice,toDev);
  }

  function investOnShare() public payable {
    uint256 price = msg.value;
    (uint256 amountShare,uint256 realPrice,uint256 toDev) = amountShareForPrice(price);
    require(price >= realPrice,"insufficient payment");

    address dev = owner();
    address payable devp = address(uint160(dev));
    devp.transfer(toDev);
    _mint(msg.sender,amountShare);
    contractBalance = contractBalance.add(price.sub(toDev));
  }

  function sellShare(uint256 amountShare) public {
    require(amountShare >= 1e18,"amount sell lt 1");
    (uint256 price,uint256 stableCoinSend) = sellPrice(amountShare);
    _burn(msg.sender,amountShare);
    msg.sender.transfer(price);
    IERC20(stableCoinAddress).transfer(msg.sender,stableCoinSend);
    contractBalance = contractBalance.sub(price);
  }

  function getMidPrice() public view returns (uint256) {
    if(totalSupply() > 0) {
      return (contractBalance.mul(1e18).div(totalSupply()));
    }
    return (1e18);
  }
}
