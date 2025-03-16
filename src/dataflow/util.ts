import { selectorFamily, RecoilValueReadOnly } from 'recoil';

const fieldSelector = selectorFamily<any, { atom: RecoilValueReadOnly<any>, key: string }>({
  key: 'dataflow-field-selector',
  get: ({ atom, key }) => ({ get }) => get(atom)?.[key],
});

export const field = <K extends string, T extends { [k in K]?: unknown } | { [k in K]: unknown } | undefined>(atom: RecoilValueReadOnly<T>, key: K): RecoilValueReadOnly<T extends object ? T[K] : undefined> => {
  return fieldSelector({ atom, key });
};
