import React from 'react';
import { View, Button, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import Lib from './Lib';

class Footer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }

  async componentDidMount() {
  }

  componentWillMount() {
  }

  openTelegram() {
    const url = 'https://t.me/leonardus549';
    Lib.openUrl(url);
  }

  render() {
    return (
      <View style={{ backgroundColor: 'gainsboro', padding: 50 }}>
        <TouchableOpacity onPress={(() => this.openTelegram())}>
          <Icon name='telegram' type='font-awesome' />
          <View style={{ height: 10 }} />
          <Text style={{ textAlign: 'center' }}>CONTACT US VIA TELEGRAM</Text>
        </TouchableOpacity>
      </View>
    );
  }

}

export default Footer;

