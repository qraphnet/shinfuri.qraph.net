import type { FC }                                         from 'react';
import { atomFamily, RecoilValueReadOnly, selectorFamily } from 'recoil';

const forms = selectorFamily<FC<JSX.IntrinsicElements['form']>, { key: number, names: readonly string[] }>({
  key: 'dataflow-forms',
  get: ({ key, names }) => ({ getCallback }) => {
    const ref = getCallback(({ set, reset }) => {
      let cleanup: () => void;
      return (form: HTMLFormElement | null) => {
        if (form == null) cleanup?.();
        else {
          const handler  = () => {
            const newData = Object.fromEntries(names.map(k => {
              const input = form.elements.namedItem(k);
              if (input == null) return [k, ''];
              if (input instanceof HTMLInputElement && input.type === 'checkbox') return [k, `${ input.checked }`];
              if ('value' in input) return [k, input.value];
              return [k, ''];
            }));
            set(formData(key), newData);
          };
          const observer = new MutationObserver(handler);
          
          const controller = new AbortController();
          form.addEventListener('input', handler, { signal: controller.signal });
          observer.observe(form, { childList: true, subtree: true });
          
          cleanup = () => {
            controller.abort();
            observer.disconnect();
            reset(formData(key));
          };
          handler();
        }
      };
    });
    return ({ ...props }) => <form { ...props } ref={ ref }/>;
  },
});

const formData = atomFamily<Record<string, string>, number>({
  key    : 'dataflow-form-data',
  default: {},
});


let key = 0;

export const makeFormState: <K extends string>(names: readonly K[]) => [RecoilValueReadOnly<FC<JSX.IntrinsicElements['form']>>, RecoilValueReadOnly<Record<K, string>>] = names => {
  key += 1;
  const state = forms({ key, names });
  return [state, formData(key)];
};

