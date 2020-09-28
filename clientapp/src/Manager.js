import { decorate, observable, action } from "mobx";
import moment from 'moment';
import axios from 'axios';
import Lib from './Lib';

const { Harmony } = require("@harmony-js/core");
const { ChainID, ChainType, hexToNumber } = require('@harmony-js/utils');
const ethers = require('ethers');
const {
  toBech32,
  fromBech32,
  getAddress
} = require('@harmony-js/crypto');

const utils = ethers.utils;
const BigNumber = ethers.BigNumber;
const OPTS = { gasPrice: utils.parseUnits('10', 'gwei').toString(), gasLimit: '1000000' };
const URL_FREE_GAS = 'https://arcane-plateau-67130.herokuapp.com/sponsored_transfer';

// testnet
// const BASE_TOKEN_ADDRESS = '0x9Dc61910a27f69895A20DFB31a5F919fd11625A5';
// const HARMONY_URL = 'https://api.s0.b.hmny.io';
// const HARMONY_CHAINTYPE = ChainType.Harmony;
// const HARMONY_CHAINID = ChainID.HmyTestnet;
// const URL_EXPLORER = 'https://explorer.pops.one/#/tx/';

// mainnet
const BASE_TOKEN_ADDRESS = '0x8402C5162a706c4b30377660fDa9C1DC93Fec677';
const HARMONY_URL = 'https://api.s0.t.hmny.io';
const HARMONY_CHAINTYPE = ChainType.Harmony;
const HARMONY_CHAINID = ChainID.HmyMainnet;
const URL_EXPLORER = 'https://explorer.harmony.one/#/tx/';

class TheManager {

  busy = false;
  voucherBalance = '0.0';
  vtSymbol = 'VIDR';
  address = false;
  addressOne = false;

  constructor() {
    this.hmy = new Harmony(HARMONY_URL, {
      chainType: HARMONY_CHAINTYPE,
      chainId: HARMONY_CHAINID,
    });
  }

  async init() {
    const hmy = this.hmy;

    const vtJson = require("./json/VoucherToken.json");
    const vtAddress = vtJson.networks[HARMONY_CHAINID].address;
    const vtContract = hmy.contracts.createContract(vtJson.abi, vtAddress);

    return { vtContract, vtAddress };
  }

  async createRandomWallet() {
    const etherWallet = ethers.Wallet.createRandom();
    await this.createWalletByMnemonic(etherWallet.mnemonic.phrase);
  }

  async createWalletByMnemonic(mnemonic) {
    const account = this.hmy.wallet.addByMnemonic(mnemonic);

    const addressOne = getAddress(account.address).bech32;
    const pk = account.privateKey;
    const etherWallet = new ethers.Wallet(pk);
    const { vtContract, vtAddress } = await this.init();
    const address = etherWallet.address;

    this.vtSymbol = await vtContract.methods.symbol().call(OPTS);
    this.etherWallet = etherWallet;
    this.vtContract = vtContract;
    this.vtAddress = vtAddress;
    this.addressOne = addressOne;
    this.address = address;
    this.mnemonic = mnemonic;

    this.refresh();
  }

  async refresh() {
    const address = this.address;
    const addressOne = this.addressOne;
    const vtContract = this.vtContract;
    const hmy = this.hmy;

    let resp = await vtContract.methods.balanceOf(address).call(OPTS);
    this.voucherBalance = utils.formatEther(resp.toString());
  }

  async payRequirement(amount, fee) {
    if (!this.address) return 1;

    const weiAmount = (utils.parseEther(amount)).toString();
    const weiFee = (utils.parseEther(fee)).toString();
    const total = BigNumber.from(weiAmount).add(weiFee);

    let resp = await this.vtContract.methods.balanceOf(this.address).call(OPTS);
    const vidrBalance = BigNumber.from(resp.toString());
    if (vidrBalance.lt(total)) return 2;
    return 0;
  }

  async signPayment(toAddress, amount, fee, data) {
    const weiAmount = (utils.parseEther(amount)).toString();
    const weiFee = (utils.parseEther(fee)).toString();

    const nonce = moment().unix() + '';
    const from = this.address;
    const to = fromBech32(toAddress);
    const data32 = ethers.utils.formatBytes32String(data);

    const hash = await this.vtContract.methods.hashSponsoredTransfer(
      nonce,
      from,
      to,
      weiAmount,
      weiFee,
      data32).call(OPTS);

    const sig = await this.etherWallet.signMessage(ethers.utils.arrayify(hash));
    const signerAddress = await this.vtContract.methods.signatureToAddress(hash, sig).call(OPTS);

    if (signerAddress !== this.address) {
      throw new Error('invalid signature');
    }

    const postData = {
      sigSender: sig,
      nonce,
      from,
      to,
      amount: weiAmount,
      fee: weiFee,
      data: data32
    };

    const resp = await axios.post(URL_FREE_GAS, postData);
    if (resp && resp.data && resp.data.txHash)
      return resp.data.txHash;

    throw new Error('pay free gas failed');
  }

  openTx(txHash) {
    const url = URL_EXPLORER + txHash;
    Lib.openUrl(url);
  }

}

decorate(TheManager, {
  voucherBalance: observable,
  vtSymbol: observable,
  busy: observable,
  address: observable,
  addressOne: observable
});

const instance = new TheManager();
export default instance;
