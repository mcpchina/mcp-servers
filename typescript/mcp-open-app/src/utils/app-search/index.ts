import { isLinux, isMac, isWin } from '../platform.js';
import darwin from './darwin.js';
import win from './win.js';
import linux from './linux.js';

export interface AppInfo {
  _name?: string;
  path?: string;
  value: string;
  keyWords: string[];
  name: string;
  names: string[];
}

let appSearch: () => Promise<AppInfo[]>;

if (isMac) {
  appSearch = darwin;
} else if (isWin) {
  appSearch = win;
} else if (isLinux) {
  appSearch = linux;
} else {
  // 默认实现，返回空数组
  appSearch = async () => [];
}

export default appSearch;
  