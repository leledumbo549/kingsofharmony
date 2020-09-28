import React from 'react';
import { View, Dimensions, ScrollView, Text } from 'react-native';

import Footer from './Footer';
import VoucherGenerator from './VoucherGenerator';
import Connection from './Connection';
import ProfitPool from './ProfitPool';
import BG from './images/bg.jpg'

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: 'busy',
      landscape: false,
      w: Dimensions.get('window').width
    };
  }

  async componentDidMount() {
    const ww = Dimensions.get('window').width;
    const wh = Dimensions.get('window').height;
    if (ww > wh) {
      this.setState({ landscape: true, w: wh });
    }
  }

  componentWillMount() {
  }

  onEnterDashboard() {
    this.setState({ show: 'dashboard' });
  }

  render() {
    let style = { flex: 1, backgroundColor: 'white' };
    let space = 10;
    if (this.state.landscape) {
      const wh = Dimensions.get('window').height;
      const w = wh;
      style = { flex: 1, width: w * (480 / 640), alignSelf: 'center', backgroundColor: 'white' };
      space = 0;
    }

    style.backgroundImage = `url(${BG})`;
    style.backgroundSize = 'cover';

    return (
      <>
        <style type="text/css">{`
          @font-face {
            font-family: 'MaterialIcons';
            src: url(${require('react-native-vector-icons/Fonts/MaterialIcons.ttf')}) format('truetype');
          }

          @font-face {
            font-family: 'FontAwesome';
            src: url(${require('react-native-vector-icons/Fonts/FontAwesome.ttf')}) format('truetype');
          }
        `}</style>

        <View>
          <View style={style}>
            <View style={{ paddingHorizontal: space, backgroundColor: 'white' }}>
              <Text> </Text>
              <VoucherGenerator />
              <Text> </Text>
              <ProfitPool />
              <Text> </Text>
              <Connection />
              <Text> </Text>
            </View>
            <Footer />
          </View>
        </View>
      </>
    );
  }

}

export default App;
