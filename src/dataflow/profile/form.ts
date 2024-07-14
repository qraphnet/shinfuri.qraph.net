import {
  kishuForeignLangList, KishuForeignLang, shohuForeignLangList, ShoshuForeignLang,
  Karui, karuiJa, classNumList,
} from 'shinfuri/lib/type-utils.js';
import {isRepetition, Repetition} from 'shinfuri/lib/repetition.js';

import { selector } from 'recoil';

import { makeFormState } from '../form.js';
import {DeepPartial} from '../../type-utils.js';

const [profileForm, formData] = makeFormState(['karui', 'classNum', 'first', 'second', 'learned', 'year', 'kind']);
export { profileForm };

export type ValidatedFormData = DeepPartial<(
    & { karui: Karui; classNum: number; first: KishuForeignLang; }
    & { lastRepetition: Repetition; }
    & ({ second: KishuForeignLang; learned: true; } | { second: ShoshuForeignLang; learned: false; })
  )>;

export const validated = selector({
  key: 'dataflow-profile-validated',
  get: ({ get }) => {
    const data = get(formData);

    const karui = data.karui in karuiJa ? data.karui as Karui : void 0

    const num = +data.classNum;
    const classNum = (num | 0) === num && 1 <= num && num <= (karui == null ? 39 : classNumList[karui]) ? num : void 0;

    const lastRepetition = { year: +data.year, kind: data.kind };

    const first = kishuForeignLangList.includes(data.first as any) ? data.first as KishuForeignLang : void 0;

    const second = data.learned === "false"
      ? {
          second: shohuForeignLangList.includes(data.second as any) ? data.second as ShoshuForeignLang : void 0,
          learned: false
        } as const
      : {
          second: kishuForeignLangList.includes(data.second as any) ? data.second as KishuForeignLang : void 0,
          learned: data.learned === "true" ? true : void 0
        } as const;

    const res = { karui, classNum, lastRepetition: isRepetition(lastRepetition) ? lastRepetition : void 0, first, ...second } satisfies ValidatedFormData;
    return res;
  },
});

export const isValid = selector<boolean>({
  key: 'profile-form-valid',
  get: ({ get }) => Object.entries(get(validated)).every(([k,v]) => k == 'lastRepetition' || v != null),
});
