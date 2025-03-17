import { selector }      from 'recoil';
import { makeFormState } from './form.tsx';

type SurveyInput = { which: 'rational' | 'floating-point' } | { which: 'neither'; actual: string; send: boolean };

export const [fpSurveyForm, formData] = makeFormState(['which', 'actual', 'send-scores']);

export const validated = selector<SurveyInput | undefined>({
  key: 'dataflow/fp-survey-form-validated',
  get: ({ get }) => {
    const data = get(formData);
    if (data.which == 'rational' || data.which == 'floating-point') {
      return { which: data.which };
    } else if (data.which == 'neither') {
      return { which: data.which, actual: data.actual, send: data['send-scores'] == 'yes' };
    }
  },
});

export const canSubmit = selector({
  key: 'dataflow/fp-survey-form-can-be-submit',
  get: ({ get }) => get(validated) != null,
});
