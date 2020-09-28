import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

class Singleton {

  async showToast(msg) {
    Toastify({
      text: msg
    }).showToast();
  }

  async delay(ms) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, ms);
    })
  }

  async getLogger() {
    return console;
  }

  async getStorageValue(key) {
    const val = window.localStorage.getItem(key);
    await this.delay(1000);
    return val;
  }

  async setStorageValue(key, val) {
    window.localStorage.setItem(key, val);
    await this.delay(1000);
  }

  async clearStorageValue() {
    window.localStorage.clear();
  }

  openUrl(url) {
    const win = window.open(url, '_blank');
    win.focus();
  }

  getRandomizer() {
    const zs = [
      '43261578', '63824715',
      '34586127', '75261483',
      '28513746', '87436152',
      '13785624', '95284137',
      '52618734', '63185427'
    ];
    return zs;
  }
}

export default new Singleton();

