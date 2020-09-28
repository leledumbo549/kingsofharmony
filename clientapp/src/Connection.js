import React from 'react';
import { View, Button, Text, ActivityIndicator, TextInput, Picker } from 'react-native';
import { observer } from "mobx-react";
import { decorate, observable, action } from "mobx";
import Config from './Config';
import moment from 'moment';
import Lib from './Lib';
import manager from './Manager';

const clipboardy = require('clipboardy');
const QRCode = require('qrcode.react');

const t = { textAlign: 'center', fontWeight: 'bold' };
const s = { textAlign: 'center' };
const c = { padding: 10, justifyContent: 'center' };

class Connection extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: 'home'
    };
  }

  async componentDidMount() {
    const mnemonic = await Lib.getStorageValue('mnemonic');
    if (mnemonic && mnemonic.length > 0) {
      try {
        await manager.createWalletByMnemonic(mnemonic);
        const address = manager.address;
        return this.setState({ mnemonic, address, show: 'connected' });
      } catch (err) {

      }
    }

    this.setState({ show: 'disconnected' });
  }

  componentWillMount() {
  }

  async createNewWallet() {
    manager.busy = true;
    try {
      await manager.createRandomWallet();
      const mnemonic = manager.mnemonic;
      const address = manager.address;
      await Lib.setStorageValue('mnemonic', mnemonic);
      this.setState({ show: 'showMnemonic' });
    } catch (err) {
      console.error(err);
      Lib.showToast('CREATE NEW WALLET FAILED');
    }
    manager.busy = false;
  }

  async importWallet() {
    manager.busy = true;
    try {
      const mnemonic = this.state.mnemonic;
      await manager.createWalletByMnemonic(mnemonic);
      const address = manager.address;
      await Lib.setStorageValue('mnemonic', mnemonic);
      this.setState({ show: 'connected' });
    } catch (err) {
      console.error(err);
      Lib.showToast('IMPORT WALLET FAILED');
    }
    manager.busy = false;
  }

  async saveMnemonic() {
    await clipboardy.write(manager.mnemonic);
    Lib.showToast('MNEMONIC SAVED TO CLIPBOARD');
  }

  async saveAddress() {
    await clipboardy.write(manager.addressOne);
    Lib.showToast('ADDRESS SAVED TO CLIPBOARD');
  }

  async logout() {
    manager.busy = true;
    await Lib.clearStorageValue();
    window.location.reload();
    return false;
  }

  async refresh() {
    manager.busy = true;
    await manager.refresh();
    manager.busy = false;
  }

  renderHome() {
    const disabled = manager.busy;
    return (
      <View style={c}>
        <Text style={s}>LOGIN BY CREATE NEW WALLET</Text>
        <View style={{ height: 10 }} />
        <Button disabled={disabled} title='NEW WALLET' onPress={() => this.createNewWallet()} />
        <Text> </Text>
        <Text style={s}>OR IMPORT PREVIOUS WALLET BY ENTER 12 MNEMONICS</Text>
        <TextInput
          secureTextEntry={true}
          disabled={disabled}
          style={{ borderWidth: 1, borderColor: 'gainsboro', padding: 10 }}
          onChangeText={(txt) => {
            this.setState({ mnemonic: txt });
          }}
          value={this.state.mnemonic}
        />
        <View style={{ height: 10 }} />
        <Button disabled={disabled} title='IMPORT' onPress={() => this.importWallet()} />
      </View>
    );
  }

  renderShowMnemonic() {
    const disabled = manager.busy;
    const mnemonic = manager.mnemonic;
    return (
      <View style={c}>
        <Text> </Text>
        <Text style={s}>{mnemonic}</Text>
        <Text> </Text>
        <Text style={s}>SAVE MNEMONIC IN SAFE PLACE. LOSE THEM MEAN LOSE YOUR WALLET.</Text>
        <Text> </Text>
        <Button disabled={disabled} title='SAVE TO CLIPBOARD' onPress={() => this.saveMnemonic()} />
        <View style={{ height: 10 }} />
        <Button disabled={disabled} title='CONTINUE' onPress={() => this.setState({ show: 'connected' })} />
      </View>
    );
  }

  renderConnected() {
    const disabled = manager.busy;
    const address = manager.addressOne;
    return (
      <View style={c}>
        <Text> </Text>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <QRCode value={address} />
        </View>
        <Text> </Text>
        <Text style={s}>ADDRESS</Text>
        <Text style={s}>{address}</Text>
        <Text> </Text>
        <Button disabled={disabled} title='SAVE ADDRESS TO CLIPBOARD' onPress={() => this.saveAddress()} />
        <View style={{ height: 10 }} />
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='REFRESH' onPress={() => this.refresh()} />
          </View>
          <View style={{ width: 10 }} />
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='LOGOUT' onPress={() => this.logout()} />
          </View>
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

    if (this.state.show === 'disconnected') {
      page = this.renderHome();
    } else if (this.state.show === 'showMnemonic') {
      page = this.renderShowMnemonic();
    } else if (this.state.show === 'connected') {
      page = this.renderConnected();
    } else {
      page = this.renderBusy();
    }

    return (
      <View style={{ borderWidth: 1, borderColor: 'gainsboro' }}>
        {page}
      </View>
    );
  }

}

export default observer(Connection);

