import { decorate, observable, action } from "mobx";
import Config from './Config';
import moment from 'moment';
import Lib from './Lib';

const { Harmony } = require("@harmony-js/core");
const { ChainID, ChainType, hexToNumber } = require('@harmony-js/utils');
const {
  toBech32,
  fromBech32,
  getAddress
} = require('@harmony-js/crypto');
const ethers = require('ethers');

const utils = ethers.utils;
const BigNumber = ethers.BigNumber;
const BASE_TOKEN_ADDRESS = '0x9Dc61910a27f69895A20DFB31a5F919fd11625A5';
const OPTS = { gasPrice: utils.parseUnits('10', 'gwei').toString(), gasLimit: '1000000' };
const URL_EXPLORER = 'https://explorer.pops.one/#/tx/';

class TheManager {

  busy = false;
  baseTokenBalance = '0.0';
  voucherBalance = '0.0';
  shareBalance = '0.0';
  gasBalance = '0.0';
  btSymbol = 'RUPE';
  vtSymbol = 'VIDR';
  kpSymbol = 'KING';
  gasSymbol = 'ONE';
  address = false;
  addressOne = false;
  baseTokenLockedInPool = '0.0';
  gasLockedInPool = '0.0';
  kpBuyPrice = '0.0';
  kpSellPrice = '0.0';
  kpSellBonus = '0.0';
  sharePercentage = '0.0';
  voucherList = [];

  constructor() {
    this.hmy = new Harmony("https://api.s0.b.hmny.io", {
      chainType: ChainType.Harmony,
      chainId: ChainID.HmyTestnet,
    });
  }

  async init() {
    const hmy = this.hmy;

    const btJson = require("./json/ERC20Detailed.json");
    const btAddress = BASE_TOKEN_ADDRESS;
    const btContract = hmy.contracts.createContract(btJson.abi, btAddress);

    const vtJson = require("./json/VoucherToken.json");
    const vtAddress = vtJson.networks[ChainID.HmyTestnet].address;
    const vtContract = hmy.contracts.createContract(vtJson.abi, vtAddress);

    const kpJson = require("./json/KOHPool.json");
    const kpAddress = kpJson.networks[ChainID.HmyTestnet].address;
    const kpContract = hmy.contracts.createContract(kpJson.abi, kpAddress);

    return { vtContract, vtAddress, btContract, kpContract, kpAddress };
  }

  async createRandomWallet() {
    const etherWallet = ethers.Wallet.createRandom();
    await this.createWalletByMnemonic(etherWallet.mnemonic.phrase);
  }

  toAddressOne(address) {
    return getAddress(account.address).bech32;
  }

  async createWalletByMnemonic(mnemonic) {
    let account = this.hmy.wallet.addByMnemonic(mnemonic);

    const addressOne = getAddress(account.address).bech32;
    const pk = account.privateKey;
    const etherWallet = new ethers.Wallet(pk);
    const { vtContract, vtAddress, btContract, kpContract, kpAddress } = await this.init();
    const address = etherWallet.address;

    this.btSymbol = await btContract.methods.symbol().call(OPTS);
    this.vtSymbol = await vtContract.methods.symbol().call(OPTS);
    this.kpSymbol = await kpContract.methods.symbol().call(OPTS);

    this.vtContract = vtContract;
    this.vtAddress = vtAddress;
    this.btContract = btContract;
    this.kpContract = kpContract;
    this.kpAddress = kpAddress;
    this.addressOne = addressOne;
    this.address = address;
    this.mnemonic = mnemonic;

    const voucherList = [
      { voucherAmount: '100000' },
      { voucherAmount: '50000' },
      { voucherAmount: '20000' },
      { voucherAmount: '10000' }
    ];

    for (let i = 0; i < voucherList.length; i++) {
      const voucherAmount = voucherList[i].voucherAmount;
      const voucherAmountInWei = (utils.parseEther(voucherAmount)).toString();

      let resp = await this.vtContract.methods.generateVoucherPrice(voucherAmountInWei).call(OPTS);
      const generatePrice = utils.formatEther(resp[0].toString());
      voucherList[i].generatePrice = generatePrice;

      resp = await this.vtContract.methods.redeemVoucherPrice(voucherAmountInWei).call(OPTS);
      const redeemPrice = utils.formatEther(resp[0].toString());
      voucherList[i].redeemPrice = redeemPrice;
    }

    this.voucherList = voucherList;

    this.refresh();
  }

  async refresh() {
    const address = this.address;
    const addressOne = this.addressOne;
    const btContract = this.btContract;
    const vtContract = this.vtContract;
    const kpContract = this.kpContract;
    const hmy = this.hmy;
    const kpAddress = this.kpAddress;

    let resp = await btContract.methods.balanceOf(address).call(OPTS);
    this.baseTokenBalance = utils.formatEther(resp.toString());

    resp = await vtContract.methods.balanceOf(address).call(OPTS);
    this.voucherBalance = utils.formatEther(resp.toString());

    resp = await kpContract.methods.balanceOf(address).call(OPTS);
    console.log('balanceOf');
    console.log(resp.toString());
    const userShare = BigNumber.from(resp.toString());
    this.shareBalance = utils.formatEther(resp.toString());

    resp = await hmy.blockchain.getBalance({ address: addressOne });
    let wei = hexToNumber(resp.result);
    this.gasBalance = utils.formatEther(wei);

    resp = await btContract.methods.balanceOf(kpAddress).call(OPTS);
    this.baseTokenLockedInPool = utils.formatEther(resp.toString());

    // resp = await hmy.blockchain.getBalance({ address: toBech32(kpAddress) });
    // wei = hexToNumber(resp.result);
    // this.gasLockedInPool = utils.formatEther(wei);

    resp = await kpContract.methods.getContractBalance().call(OPTS);
    this.gasLockedInPool = utils.formatEther(resp.toString());

    resp = await kpContract.methods.totalSupply().call(OPTS);
    console.log('totalSupply');
    console.log(resp.toString());
    const totalShare = BigNumber.from(resp.toString());
    this.totalShare = utils.formatEther(resp.toString());

    this.sharePercentage = '0.0';
    if (totalShare.gt(0)) this.sharePercentage = userShare.mul(100).div(totalShare).toString();

    const oneInWei = (utils.parseEther('1')).toString();

    resp = await kpContract.methods.buyPrice(oneInWei).call(OPTS);
    this.kpBuyPrice = utils.formatEther(resp[0].toString());

    resp = await kpContract.methods.sellPrice(oneInWei).call(OPTS);

    this.kpSellPrice = utils.formatEther(resp[0].toString());
    this.kpSellBonus = utils.formatEther(resp[1].toString());
  }

  async generateVoucher(amount, toAddress) {
    const wei = (utils.parseEther(amount)).toString();
    const to = fromBech32(toAddress);
    const tx = await this.vtContract.methods.generateVoucher(to, wei).send(OPTS);
    const receipt = tx.transaction.receipt;
    if (receipt.status === "0x1") return receipt.transactionHash;
    throw new Error('generateVoucher fail');
  }

  async generateVoucherRequirement(amount) {
    if (!this.address) return 1;

    const wei = (utils.parseEther(amount)).toString();
    let resp = await this.vtContract.methods.generateVoucherPrice(wei).call(OPTS);
    const price = BigNumber.from(resp[0].toString());

    resp = await this.btContract.methods.balanceOf(this.address).call(OPTS);
    const baseTokenBalance = BigNumber.from(resp.toString());

    resp = await this.btContract.methods.allowance(this.address, this.vtAddress).call(OPTS);
    const allowance = BigNumber.from(resp.toString());

    const baseTokenBalanceNotEnough = baseTokenBalance.lt(price);
    const allowanceNotEnough = allowance.lt(price);

    if (baseTokenBalanceNotEnough) return 2;
    else if (allowanceNotEnough) return 3;
    return 0;
  }

  async approveBaseTokenSpending() {
    const maxToken = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
    const tx = await this.btContract.methods.approve(this.vtAddress, maxToken).send(OPTS);
    const receipt = tx.transaction.receipt;
    if (receipt.status === "0x1") return receipt.transactionHash;
    throw new Error('approveBaseTokenSpending fail');
  }

  async getVoucherPrice(amount) {
    const wei = (utils.parseEther(amount)).toString();
    let resp = await this.vtContract.methods.generateVoucherPrice(wei).call(OPTS);
    return utils.formatEther(resp[0].toString());
  }

  openTx(txHash) {
    const url = URL_EXPLORER + txHash;
    Lib.openUrl(url);
  }

  async getInvestDetail(price) {
    try {
      let wei = (utils.parseEther(price)).toString();
      let resp = await this.kpContract.methods.amountShareForPrice(wei).call(OPTS);
      const amountShare = BigNumber.from(resp[0].toString());
      const amountShareStr = utils.formatEther(resp[0].toString());

      resp = await this.kpContract.methods.totalSupply().call(OPTS);
      const totalShare = BigNumber.from(resp.toString());

      let percentage = '100';
      if (totalShare.gt(0)) {
        const nextTotalShare = totalShare.add(amountShare);
        percentage = amountShare.mul(100).div(nextTotalShare).toString();
      }

      return {
        amountShare: amountShareStr,
        percentage
      };
    } catch (err) {

    }

    return {
      amountShare: '0',
      percentage: '0'
    };
  }

  async buyShareRequirement(toInvest) {
    if (!this.address) return 1;
    const toInvestBN = BigNumber.from((utils.parseEther(toInvest)).toString());
    const resp = await this.hmy.blockchain.getBalance({ address: this.addressOne });
    const wei = hexToNumber(resp.result);
    const ownedBN = BigNumber.from(wei);
    if (ownedBN.lte(toInvestBN)) return 2;
    return 0;
  }

  async buyShare(toInvest) {
    const wei = (utils.parseEther(toInvest)).toString();
    const opts = Object.assign({
      value: wei
    }, OPTS);
    const tx = await this.kpContract.methods.investOnShare().send(opts);
    const receipt = tx.transaction.receipt;
    console.log(receipt);
    if (receipt.status === "0x1") return receipt.transactionHash;
    throw new Error('buyShare fail');
  }

  async getRedeemDetail(amountShare) {
    try {
      const wei = (utils.parseEther(amountShare)).toString();
      const resp = await this.kpContract.methods.sellPrice(wei).call(OPTS);
      const sellPrice = utils.formatEther(resp[0].toString());
      const sellBonus = utils.formatEther(resp[1].toString());

      return {
        sellPrice,
        sellBonus
      };
    } catch (err) {
    }

    return {
      sellPrice: '0',
      sellBonus: '0'
    };
  }

  async sellShareRequirement(toRedeem) {
    if (!this.address) return 1;
    const shareToRedeem = (utils.parseEther(toRedeem)).toString();
    const resp = await this.kpContract.methods.balanceOf(this.address).call(OPTS);
    const shareOwned = BigNumber.from(resp.toString());
    if (shareOwned.lt(shareToRedeem)) return 2;
    return 0;
  }

  async sellShare(toRedeem) {
    const wei = (utils.parseEther(toRedeem)).toString();
    const tx = await this.kpContract.methods.sellShare(wei).send(OPTS);
    const receipt = tx.transaction.receipt;
    console.log(receipt);
    if (receipt.status === "0x1") return receipt.transactionHash;
    throw new Error('sellShare fail');
  }

}

decorate(TheManager, {
  baseTokenBalance: observable,
  baseTokenBalance: observable,
  voucherBalance: observable,
  shareBalance: observable,
  gasBalance: observable,
  btSymbol: observable,
  vtSymbol: observable,
  kpSymbol: observable,
  gasSymbol: observable,
  busy: observable,
  address: observable,
  addressOne: observable,
  baseTokenLockedInPool: observable,
  gasLockedInPool: observable,
  kpBuyPrice: observable,
  kpSellPrice: observable,
  kpSellBonus: observable,
  sharePercentage: observable,
  voucherList: observable
});

const instance = new TheManager();
export default instance;
