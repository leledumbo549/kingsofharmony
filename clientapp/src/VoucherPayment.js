import React from 'react';
import { View, Button, Text, ActivityIndicator, TextInput } from 'react-native';
import { observer } from "mobx-react";
import Lib from './Lib';
import manager from './Manager';
import Carousel from '@brainhubeu/react-carousel';
import '@brainhubeu/react-carousel/lib/style.css';
import VOUCHER1 from './images/voucher1.png';
import VOUCHER2 from './images/voucher2.png';
import VOUCHER3 from './images/voucher3.png';

const t = { textAlign: 'center', fontWeight: 'bold' };
const s = { textAlign: 'center' };
const c = { padding: 10, justifyContent: 'center' };

class VoucherPayment extends React.Component {
  constructor(props) {
    super(props);
    this.items = [
      { amount: '20000', data: 'SKU00001' },
      { amount: '35000', data: 'SKU00002' },
      { amount: '70000', data: 'SKU00003' },
    ];

    this.state = {
      show: 'home',
      toAddress: 'one1dpaunk527jcha4dqmelxmupfx5qlzuk3je3vh7',
      amount: this.items[0].amount,
      data: this.items[0].data,
      fee: '1000',
      txHash: ''
    };
  }

  componentDidMount() {
  }

  componentWillMount() {
  }

  async confirmPay() {
    manager.busy = true;
    try {
      const { amount, fee, data, toAddress } = this.state;
      const txHash = await manager.signPayment(toAddress, amount, fee, data);
      await manager.refresh();
      this.setState({ show: 'success', txHash });
    } catch (err) {
      console.error(err);
      Lib.showToast('PAYMENT FAILED');
    }
    manager.busy = false;
  }

  async payRequirement() {
    if (!manager.address) return Lib.showToast('PLEASE LOGIN');

    const vtSymbol = manager.vtSymbol;
    const { amount, fee, toAddress } = this.state;

    if (toAddress.length === 0) return Lib.showToast('ADDRESS MUST BE SET');

    manager.busy = true;
    const retCode = await manager.payRequirement(amount, fee);
    manager.busy = false;

    if (retCode === 1) {
      return Lib.showToast('LOG IN FIRST');
    } else if (retCode === 2) {
      const msg = 'BALANCE ' + vtSymbol + ' IS NOT ENOUGH';
      return Lib.showToast(msg.toUpperCase());
    }

    return this.setState({ show: 'confirm' });
  }

  handleLayout(layout) {
    const { x, y, width, height } = layout;
    if (!this.state.imgWidth) {
      let x = width;
      if (x > 240) x = 240;
      this.setState({ imgWidth: x, imgHeight: x });
    }
  }

  onItem(index) {
    this.setState({
      amount: this.items[index].amount,
      data: this.items[index].data
    });
  }

  renderHome() {
    const disabled = manager.busy;

    let carousel = <View style={{ flex: 1 }} onLayout={(event) => this.handleLayout(event.nativeEvent.layout)} />
    if (this.state.imgWidth) {
      const w = this.state.imgWidth;
      const h = this.state.imgHeight;
      const draggable = (this.state.show === 'home' && !disabled);
      carousel = (
        <Carousel
          draggable={draggable}
          onChange={e => this.onItem(e)}
        >
          <img style={{ objectFit: 'cover', height: h }} src={VOUCHER1} />
          <img style={{ objectFit: 'cover', height: h }} src={VOUCHER2} />
          <img style={{ objectFit: 'cover', height: h }} src={VOUCHER3} />
        </Carousel>
      );
    }

    let ctl;
    if (this.state.show === 'home') {
      ctl = <Button disabled={disabled} title='PAY' onPress={() => this.payRequirement()} />;
    } else if (this.state.show === 'confirm') {
      ctl = this.renderCtlConfirm();
    } else if (this.state.show === 'success') {
      ctl = this.renderCtlSuccess();
    }

    return (
      <View style={{ flex: 1, padding: 10, justifyContent: 'center' }}>
        {carousel}
        <Text> </Text>
        <Text style={{ textAlign: 'center' }}>PAY FOR ADDRESS</Text>
        <Text style={{ textAlign: 'center' }}>{this.state.toAddress}</Text>
        <Text style={{ textAlign: 'center' }}>PAYMENT DATA</Text>
        <Text style={{ textAlign: 'center' }}>{this.state.data}</Text>
        <Text style={{ textAlign: 'center' }}>PAYMENT AMOUNT: {this.state.amount}</Text>
        <Text style={{ textAlign: 'center' }}>PAYMENT FEE: {this.state.fee}</Text>
        <Text> </Text>
        {ctl}
      </View>
    );
  }

  renderCtlConfirm() {
    const disabled = manager.busy;
    return (
      <View>
        <Text style={s}>SIGN TRANSACTION & PAY</Text>
        <Text> </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='YES' onPress={() => this.confirmPay()} />
          </View>
          <View style={{ width: 10, height: 10 }} />
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='CANCEL' onPress={() => this.setState({ show: 'home' })} />
          </View>
        </View>
      </View>
    );
  }

  renderCtlSuccess() {
    const disabled = manager.busy;
    const { txHash } = this.state;
    return (
      <View>
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
    const vtSymbol = manager.vtSymbol;
    const voucherBalance = manager.voucherBalance;

    return (
      <View style={{ borderTopWidth: 1, borderColor: 'gainsboro' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10 }}>
          <Text>{vtSymbol}</Text>
          <Text>{voucherBalance}</Text>
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
    return (
      <View style={{ flex: 1, borderWidth: 1, borderColor: 'gainsboro' }}>
        <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: 'gainsboro' }}>
          <Text style={t}>VOUCHER PAYMENT</Text>
        </View>
        <View style={{ flex: 1 }}>
          {this.renderHome()}
        </View>
        {this.renderFooter()}
      </View>
    );
  }

}

export default observer(VoucherPayment);

