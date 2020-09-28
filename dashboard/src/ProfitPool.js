import React from 'react';
import { View, Button, Text, ActivityIndicator, TextInput, Picker } from 'react-native';
import { observer } from "mobx-react";
import Lib from './Lib';
import manager from './Manager';

const t = { textAlign: 'center', fontWeight: 'bold' };
const s = { textAlign: 'center' };
const c = { padding: 10, justifyContent: 'center' };

class ProfitPool extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: 'home',
      toInvest: '',
      toRedeem: '',
      buyAmountShare: '0',
      buyPercentage: '0',
      sellPrice: '0',
      sellBonus: '0'
    };
  }

  componentDidMount() {
  }

  componentWillMount() {
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

  renderPool() {
    const disabled = manager.busy;
    const gasSymbol = manager.gasSymbol;
    const baseTokenSymbol = manager.btSymbol;
    const pctg = manager.sharePercentage;
    const kpBuyPrice = manager.kpBuyPrice;
    const kpSellPrice = manager.kpSellPrice;
    const kpSellBonus = manager.kpSellBonus;
    const shareBalance = manager.shareBalance;
    const baseTokenLockedInPool = manager.baseTokenLockedInPool;
    const gasLockedInPool = manager.gasLockedInPool;
    const big = { textAlign: 'center', fontSize: 30 };

    return (
      <View style={c}>
        <Text style={s}>ASSETS IN POOL</Text>
        <Text style={s}>{gasLockedInPool} {gasSymbol}</Text>
        <Text style={s}>{baseTokenLockedInPool} {baseTokenSymbol}</Text>
        <Text> </Text>
        <Text style={big}>{shareBalance}</Text>
        <Text style={s}>SHARE OWNED</Text>
        <Text style={s}>[ {pctg} % ]</Text>
        <Text> </Text>
        <Text style={s}>SHARE PRICE</Text>
        <Text style={s}>{kpBuyPrice}/{kpSellPrice} {gasSymbol}</Text>
        <Text style={s}>REDEEM BONUS</Text>
        <Text style={s}>+{kpSellBonus} {baseTokenSymbol}</Text>
      </View>
    );
  }

  toPage(name) {
    if (!manager.address) return Lib.showToast('PLEASE LOGIN');
    this.setState({ show: name });
  }

  renderHome() {
    const disabled = manager.busy;

    return (
      <View style={c}>
        <Button disabled={disabled} title='ADD SHARE' onPress={() => this.toPage('inputBuy')} />
        <View style={{ height: 10 }} />
        <Button disabled={disabled} title='REDEEM SHARE' onPress={() => this.toPage('inputSell')} />
        <Text> </Text>
      </View>
    );
  }

  async setInvestAmount(txt) {
    this.setState({ toInvest: txt });
    if (Number(txt) > 0) {
      const detail = await manager.getInvestDetail(txt);
      this.setState({
        buyAmountShare: detail.amountShare,
        buyPercentage: detail.percentage
      });
    } else {
      this.setState({
        buyAmountShare: '0',
        buyPercentage: '0'
      })
    }
  }

  async setRedeemAmount(txt) {
    this.setState({ toRedeem: txt });
    if (Number(txt) > 0) {
      const { sellPrice, sellBonus } = await manager.getRedeemDetail(txt);
      this.setState({
        sellPrice,
        sellBonus
      });
    } else {
      this.setState({
        sellPrice: '0',
        sellBonus: '0'
      })
    }
  }

  async buyShareRequirement() {
    const gasSymbol = manager.gasSymbol;
    const { toInvest } = this.state;

    if (Number(toInvest) > 0) {
    } else {
      return Lib.showToast('INVALID AMOUNT');
    }

    manager.busy = true;
    const retCode = await manager.buyShareRequirement(toInvest);
    const detail = await manager.getInvestDetail(toInvest);
    this.setState({
      buyAmountShare: detail.amountShare,
      buyPercentage: detail.percentage
    });
    manager.busy = false;

    if (retCode === 1) {
      return Lib.showToast('LOG IN FIRST');
    } else if (retCode === 2) {
      const msg = 'BALANCE ' + gasSymbol + ' IS NOT ENOUGH';
      return Lib.showToast(msg.toUpperCase());
    }

    return this.setState({ show: 'confirmBuy' });

  }

  async confirmBuyShare() {
    manager.busy = true;
    try {
      const { toInvest } = this.state;
      let txHash = await manager.buyShare(toInvest);
      await manager.refresh();
      this.setState({ show: 'success', txHash });
    } catch (err) {
      console.error(err);
      Lib.showToast('ADD SHARE FAILED');
    }
    manager.busy = false;
  }

  async sellShareRequirement() {
    const gasSymbol = manager.gasSymbol;
    const { toRedeem } = this.state;

    if (Number(toRedeem) > 0) {
    } else {
      return Lib.showToast('INVALID AMOUNT');
    }

    manager.busy = true;
    const retCode = await manager.sellShareRequirement(toRedeem);
    const { sellPrice, sellBonus } = await manager.getRedeemDetail(toRedeem);
    this.setState({
      sellPrice,
      sellBonus
    });
    manager.busy = false;

    if (retCode === 1) {
      return Lib.showToast('LOG IN FIRST');
    } else if (retCode === 2) {
      const msg = 'SHARE IS NOT ENOUGH';
      return Lib.showToast(msg.toUpperCase());
    }

    return this.setState({ show: 'confirmSell' });

  }

  async confirmSellShare() {
    manager.busy = true;
    try {
      const { toRedeem } = this.state;
      let txHash = await manager.sellShare(toRedeem);
      await manager.refresh();
      this.setState({ show: 'success', txHash });
    } catch (err) {
      console.error(err);
      Lib.showToast('ADD SHARE FAILED');
    }
    manager.busy = false;
  }

  renderInputBuy() {
    const disabled = manager.busy;
    const share = this.state.buyAmountShare;
    const pctg = this.state.buyPercentage;

    return (
      <View style={c}>
        <Text style={s}>ENTER AMOUNT ONE TO INVEST</Text>
        <TextInput
          disabled={disabled}
          style={{ borderWidth: 1, borderColor: 'gainsboro', padding: 10 }}
          onChangeText={(txt) => this.setInvestAmount(txt)}
          value={this.state.toInvest}
        />
        <Text> </Text>
        <Text style={s}>SHARE RECEIVED: {share}</Text>
        <Text style={s}>PERCENTAGE: {pctg}%</Text>
        <Text> </Text>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='CONTINUE' onPress={() => this.buyShareRequirement()} />
          </View>
          <View style={{ width: 10 }} />
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='CANCEL' onPress={() => this.setState({ show: 'home' })} />
          </View>
        </View>


      </View>
    );

  }

  renderConfirmBuy() {
    const disabled = manager.busy;
    const gasSymbol = manager.gasSymbol;
    const share = this.state.buyAmountShare;
    const pctg = this.state.buyPercentage;
    const { toInvest } = this.state;
    return (
      <View style={c}>
        <Text style={s}>CONFIRM INVEST {toInvest} {gasSymbol} FOR {share} SHARE OR {pctg}% POOL</Text>
        <Text> </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='CONFIRM' onPress={() => this.confirmBuyShare()} />
          </View>
          <View style={{ width: 10, height: 10 }} />
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='CANCEL' onPress={() => this.setState({ show: 'home' })} />
          </View>
        </View>
      </View>
    );
  }

  renderConfirmSell() {
    const disabled = manager.busy;
    const gasSymbol = manager.gasSymbol;
    const btSymbol = manager.btSymbol;
    const { sellPrice, sellBonus, toRedeem } = this.state;
    return (
      <View style={c}>
        <Text style={s}>CONFIRM REDEEM {toRedeem} SHARE FOR {sellPrice} {gasSymbol} +{sellBonus} {btSymbol}</Text>
        <Text> </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='CONFIRM' onPress={() => this.confirmSellShare()} />
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

  renderInputSell() {
    const disabled = manager.busy;
    const gasSymbol = manager.gasSymbol;
    const btSymbol = manager.btSymbol;
    const { sellPrice, sellBonus } = this.state;

    return (
      <View style={c}>
        <Text style={s}>ENTER AMOUNT SHARE TO REDEEM</Text>
        <TextInput
          disabled={disabled}
          style={{ borderWidth: 1, borderColor: 'gainsboro', padding: 10 }}
          onChangeText={(txt) => this.setRedeemAmount(txt)}
          value={this.state.toRedeem}
        />
        <Text> </Text>
        <Text style={s}>WILL RECEIVED: {sellPrice} {gasSymbol} +{sellBonus} {btSymbol}</Text>
        <Text> </Text>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='CONTINUE' onPress={() => this.sellShareRequirement()} />
          </View>
          <View style={{ width: 10 }} />
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='CANCEL' onPress={() => this.setState({ show: 'home' })} />
          </View>
        </View>

      </View>
    );

  }

  render() {
    let page = this.renderHome();
    if (this.state.show === 'inputBuy') page = this.renderInputBuy();
    else if (this.state.show === 'confirmBuy') page = this.renderConfirmBuy();
    else if (this.state.show === 'success') page = this.renderSuccess();
    else if (this.state.show === 'inputSell') page = this.renderInputSell();
    else if (this.state.show === 'confirmSell') page = this.renderConfirmSell();

    return (
      <View style={{ borderWidth: 1, borderColor: 'gainsboro' }}>
        <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: 'gainsboro' }}>
          <Text style={t}>KINGS OF HARMONY</Text>
        </View>
        {this.renderPool()}
        {page}
        {this.renderFooter()}
      </View>
    );
  }

}

export default observer(ProfitPool);

