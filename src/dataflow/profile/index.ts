import { Options } from 'shinfuri';
import { isLanguageOption, isKarui } from 'shinfuri/lib/type-utils.js';
import { Repetition, isRepetition } from 'shinfuri/lib/repetition.js';

import { atom } from 'recoil';

import { localStorage } from '../../local-storage.js';

export type Profile = Pick<Options, 'karui' | 'langOption'> & { classNum: number; lastRepetition?: Repetition };

const validator = (data: unknown): data is Profile => {
  if (!('object' === typeof data && data != null && 'karui' in data && 'langOption' in data && 'classNum' in data)) return false;
  const { karui, langOption, classNum } = data;

  if (!isKarui(karui)) return false;

  if ('number' !== typeof classNum) return false;

  if ('lastRepetition' in data && data.lastRepetition != null && !isRepetition(data.lastRepetition)) return false;

  return isLanguageOption(langOption);
};

const storageKey = 'dataflow/profile';
export const profileState = atom<Profile | undefined>({
  key: 'dataflow-profile',
  effects: [
    ({ setSelf, onSet }) => {
      const cache = localStorage.getItem(storageKey);
      if (cache == null) setSelf(void 0);
      else {
        const parsed = JSON.parse(cache);
        setSelf(validator(parsed) ? parsed : void 0);
      }

      onSet((v, _, isReset) => {
        if (isReset) localStorage.removeItem(storageKey);
        else localStorage.setItem(storageKey, JSON.stringify(v));
      });
    },
  ],
});

