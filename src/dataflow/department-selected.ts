import { atom, selector }         from 'recoil';
import { department, Department } from 'shinfuri/lib/department/index.js';
import { makeFormState }          from './form.js';

const [departmentsForm, formData] = makeFormState(department);
export { departmentsForm };

const storageKey = 'dataflow/department-selected';

export const selectedDepartments = atom<Set<Department>>({
  key    : 'dataflow-department-selected',
  effects: [
    ({ setSelf, onSet }) => {
      const cache = localStorage.getItem(storageKey);
      if (cache == null) setSelf(new Set(['基本平均点', '工学部指定平均点', '農学部指定平均点']));
      else {
        const parsed = JSON.parse(cache);
        setSelf(new Set(parsed));
      }
      
      onSet((v, _, isReset) => {
        if (isReset) localStorage.removeItem(storageKey);
        else localStorage.setItem(storageKey, JSON.stringify(Array.from(v)));
      });
    },
  ],
});

export const inputDepartments = selector<Set<Department>>({
  key: 'dataflow-department-input',
  get: ({ get }) =>
    new Set(Object.entries(get(formData)).filter(([, v]) => v === 'true').map(([k]) => k as Department)),
});

export const alteredState = selector<boolean>({
  key: 'dataflow-department-input-altered',
  get: ({ get }) => {
    const current = get(selectedDepartments);
    const input   = get(inputDepartments);
    return !(current.size === input.size && Array.from(input).every(current.has.bind(current)));
  },
});
