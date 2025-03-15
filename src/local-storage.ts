class LocalStorage {
  private storage: Storage | undefined;
  private keymap: Record<string, string>;
  
  constructor(readonly prefix: string) {
    try {
      this.storage = window.localStorage;
      this.keymap  = JSON.parse(this.storage.getItem(prefix + '/keymap') ?? '{}');
    } catch (e) {
      this.storage = void 0;
      this.keymap  = {};
      console.log(e);
    }
  }
  
  mapping(key: string): string {
    if (key in this.keymap) return this.keymap[key];
    else {
      const generated  = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).substring(0, 32);
      this.keymap[key] = this.prefix + '/' + generated;
      this.storage?.setItem(this.prefix + '/keymap', JSON.stringify(this.keymap));
      return generated;
    }
  }
  
  getItem(key: string): string | undefined {
    return this.storage && (this.storage.getItem(this.mapping(key)) ?? void 0);
  }
  
  setItem(key: string, value: string) {
    this.storage?.setItem(this.mapping(key), value);
  }
  
  removeItem(key: string) {
    this.storage?.removeItem(this.mapping(key));
    delete this.keymap[key];
  }
}

export const localStorage = new LocalStorage('host');
