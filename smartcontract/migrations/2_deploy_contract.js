const VT = artifacts.require("VoucherToken.sol");
const KP = artifacts.require("KOHPool.sol");

module.exports = async function (deployer, network, accounts) {
  const btAddress = '0x9Dc61910a27f69895A20DFB31a5F919fd11625A5';

  await deployer.deploy(VT);
  const vt = await VT.deployed();
  const vtAddress = vt.address;

  await deployer.deploy(KP, btAddress);
  const kp = await KP.deployed();
  const kpAddress = kp.address;

  await vt.setup(btAddress, kpAddress);
  console.log({
    btAddress, vtAddress, kpAddress
  });
};