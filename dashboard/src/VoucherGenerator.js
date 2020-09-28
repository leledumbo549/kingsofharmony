import React from 'react';
import { View, Button, Text, ActivityIndicator, TextInput, Picker } from 'react-native';
import { observer } from "mobx-react";
import { decorate, observable, action } from "mobx";
import Config from './Config';
import moment from 'moment';
import Lib from './Lib';
import manager from './Manager';

const t = { textAlign: 'center', fontWeight: 'bold' };
const s = { textAlign: 'center' };
const c = { padding: 10, justifyContent: 'center' };

class VoucherGenerator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: 'home',
      voucherAmount: '100000',
      toAddress: 'one19qkngj6ulzm0s5m9hedyadms929u69axl7d9q5',
      price: '',
      txHash: ''
    };
  }

  componentDidMount() {
  }

  componentWillMount() {
  }

  setVoucherAmount(amount) {
    this.setState({ voucherAmount: amount });
  }

  async confirmGenerate() {
    manager.busy = true;
    try {
      const { voucherAmount, toAddress } = this.state;
      let txHash = await manager.generateVoucher(voucherAmount, toAddress);
      await manager.refresh();
      this.setState({ show: 'success', txHash });
    } catch (err) {
      console.error(err);
      Lib.showToast('GENERATE VOUCHER FAILED');
    }
    manager.busy = false;
  }

  async generateVoucherRequirement() {
    if (!manager.address) return Lib.showToast('PLEASE LOGIN');

    const gasSymbol = manager.gasSymbol;
    const baseTokenSymbol = manager.btSymbol;
    const { voucherAmount, toAddress } = this.state;

    if (toAddress.length === 0) return Lib.showToast('ADDRESS MUST BE SET');

    manager.busy = true;
    const retCode = await manager.generateVoucherRequirement(voucherAmount);
    const price = await manager.getVoucherPrice(voucherAmount);
    manager.busy = false;

    if (retCode === 1) {
      return Lib.showToast('LOG IN FIRST');
    } else if (retCode === 2) {
      const msg = 'BALANCE ' + baseTokenSymbol + ' IS NOT ENOUGH';
      return Lib.showToast(msg.toUpperCase());
    } else if (retCode === 3) {
      return this.setState({ show: 'needApproval' });
    }

    return this.setState({ show: 'confirm', price });
  }

  async approve() {
    manager.busy = true;
    try {
      const txHash = await manager.approveBaseTokenSpending();
      await this.generateVoucherRequirement();
    } catch (err) {
      console.error(err);
      Lib.showToast('APPROVE FAILED');
    }
    manager.busy = false;
  }

  renderHome() {
    const disabled = manager.busy;
    const rows = manager.voucherList;
    const btSymbol = manager.btSymbol;
    const vtSymbol = manager.vtSymbol;
    return (
      <View style={c}>
        <Text style={s}>SELECT VOUCHER</Text>
        <Picker
          disabled={disabled}
          selectedValue={this.state.voucherAmount}
          onValueChange={(itemValue) => this.setVoucherAmount(itemValue)}
        >
          {rows.map((item, i) => {
            const va = item.voucherAmount;
            const gp = item.generatePrice;
            const label = va + ' ' + vtSymbol + ' [' + gp + ' ' + btSymbol + ']';
            return (
              <Picker.Item key={va} label={label} value={va} />
            );
          })}

        </Picker>
        <Text> </Text>
        <Text style={s}>FOR ADDRESS</Text>
        <TextInput
          disabled={disabled}
          style={{ borderWidth: 1, borderColor: 'gainsboro', padding: 10 }}
          onChangeText={(txt) => {
            this.setState({ toAddress: txt });
          }}
          value={this.state.toAddress}
        />
        <Text> </Text>
        <Button disabled={disabled} title='GENERATE' onPress={() => this.generateVoucherRequirement()} />
      </View>
    );
  }

  renderNeedApproval() {
    const disabled = manager.busy;
    const gasSymbol = manager.gasSymbol;
    const baseTokenSymbol = manager.btSymbol;
    return (
      <View style={c}>
        <Text style={s}>APPROVE VOUCHER GENERATOR TO SPEND {baseTokenSymbol}</Text>
        <Text> </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='APPROVE' onPress={() => this.approve()} />
          </View>
          <View style={{ width: 10 }} />
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='CANCEL' onPress={() => this.setState({ show: 'home' })} />
          </View>
        </View>
      </View>
    );
  }

  renderConfirm() {
    const disabled = manager.busy;
    const gasSymbol = manager.gasSymbol;
    const baseTokenSymbol = manager.btSymbol;
    const { price, voucherAmount } = this.state;
    return (
      <View style={c}>
        <Text style={s}>CONFIRM GENERATE VOUCHER {voucherAmount} FOR {price} {baseTokenSymbol}</Text>
        <Text> </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='CONFIRM' onPress={() => this.confirmGenerate()} />
          </View>
          <View style={{ width: 10, height: 10 }} />
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='CANCEL' onPress={() => this.setState({ show: 'home' })} />
          </View>
        </View>
      </View>
    );
  }

  renderSuccess() {
    const disabled = manager.busy;
    const { txHash } = this.state;
    return (
      <View style={c}>
        <Text style={s}>TRANSACTION SUCCESS</Text>
        <Text style={{ textAlign: 'center', fontSize: 10 }}>{txHash}</Text>
        <Text> </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='EXPLORE TX' onPress={() => manager.openTx(this.state.txHash)} />
          </View>
          <View style={{ width: 10, height: 10 }} />
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='BACK' onPress={() => this.setState({ show: 'home' })} />
          </View>
        </View>
      </View>
    );
  }

  renderFooter() {
    const gasSymbol = manager.gasSymbol;
    const baseTokenSymbol = manager.btSymbol;
    const baseTokenBalance = manager.baseTokenBalance;
    const gasBalance = manager.gasBalance;
    return (
      <View style={{ borderTopWidth: 1, borderColor: 'gainsboro' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderBottomWidth: 1, borderBottomColor: 'gainsboro' }}>
          <Text>{baseTokenSymbol}</Text>
          <Text>{baseTokenBalance}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10 }}>
          <Text>{gasSymbol}</Text>
          <Text>{gasBalance}</Text>
        </View>
      </View>
    );
  }

  renderBusy() {
    return (
      <View style={c}>
        <Text> </Text>
        <Text style={s}><ActivityIndicator /></Text>
        <Text> </Text>
      </View>
    );
  }

  render() {
    let page;

    if (this.state.show === 'home') {
      page = this.renderHome();
    } else if (this.state.show === 'needApproval') {
      page = this.renderNeedApproval();
    } else if (this.state.show === 'confirm') {
      page = this.renderConfirm();
    } else if (this.state.show === 'success') {
      page = this.renderSuccess();
    } else {
      page = this.renderBusy();
    }

    return (
      <View style={{ borderWidth: 1, borderColor: 'gainsboro' }}>
        <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: 'gainsboro' }}>
          <Text style={t}>VOUCHER GENERATOR</Text>
        </View>
        {page}
        {this.renderFooter()}
      </View>
    );
  }

}

export default observer(VoucherGenerator);

