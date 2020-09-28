const { Harmony } = require("@harmony-js/core");
const { ChainID, ChainType, hexToNumber } = require('@harmony-js/utils');
const {
  getAddress
} = require('@harmony-js/crypto');
const ethers = require('ethers');
const utils = ethers.utils;

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

const hmy = new Harmony(HARMONY_URL, {
  chainType: HARMONY_CHAINTYPE,
  chainId: HARMONY_CHAINID,
});

const mnemonic = 'SETUP MNEMONIC';

const account = hmy.wallet.addByMnemonic(mnemonic);
const addressOne = getAddress(account.address).bech32;

const vtJson = require("./VoucherToken.json");
const vtAddress = vtJson.networks[HARMONY_CHAINID].address;
const vtContract = hmy.contracts.createContract(vtJson.abi, vtAddress);

const OPTS = { gasPrice: utils.parseUnits('10', 'gwei').toString(), gasLimit: '1000000' };

async function logBalance() {
  let resp = await hmy.blockchain.getBalance({ address: addressOne });
  let wei = hexToNumber(resp.result);
  resp = await vtContract.methods.balanceOf(account.address).call(OPTS);
  const voucherBalance = resp.toString();
  console.log({ vtAddress, OPTS, wei, voucherBalance });
}

const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 8888;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/sponsored_transfer', async (req, res) => {
  const json = req.body;
  console.log('sponsored transfer..');
  if (json.fee === '1000000000000000000000') {
    const txHash = await doTransfer(json);
    if (txHash) return res.json({ txHash });
  } else {
    console.log(json);
  }

  res.json(json);
});

app.get('/check', (req, res) => {
  res.json({ result: 'ok' });
});

app.listen(port, () => {
  console.log(`PaymentBot listening on port ${port}!`);
  logBalance();
});

async function doTransfer(json) {
  console.log(json);
  try {
    const resp = await vtContract.methods.sponsoredTransfer(
      json.sigSender,
      json.nonce,
      json.from,
      json.to,
      json.amount,
      json.fee,
      json.data).send(OPTS);
    const receipt = resp.transaction.receipt;
    const success = (receipt && receipt.status === '0x1');

    if (success) {
      console.log(receipt);
      return receipt.transactionHash;
    } else if (receipt) {
      console.log(receipt);
      console.log('gas problem...');
    } else {
      console.log('other error...');
    }

  } catch (err) {
    console.error(err);
  }
}
