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

}

export default new Singleton();

