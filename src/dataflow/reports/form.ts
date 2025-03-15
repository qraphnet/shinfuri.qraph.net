import { atom, selector }                                           from 'recoil';
import { getCourseCode, Scope }                                     from 'shinfuri/lib/course-code.js';
import { isCredit, isTerm }                                         from 'shinfuri/lib/course.js';
import { isScoredGrade, isUnscoredGrade, UnenrolledSpecificReport } from 'shinfuri/lib/report.js';

import { DeepPartial }   from '../../type-utils.js';
import { makeFormState } from '../form.js';
import { profileState }  from '../profile/index.js';
import { InputReport }   from './index.js';


export const [reportForm, formData] = makeFormState(['title', 'year', 'term', 'credit', 'grade', 'point', 'minpoint', 'maxpoint']);

export type PartialReport = InputReport extends infer T extends object ? DeepPartial<T> : never;

export const partialReport = selector({
  key: 'dataflow-reports-partial',
  get: ({ get }) => {
    const data    = get(formData);
    const profile = get(profileState);
    if (profile == null) throw Error('illegal call of the validated report data selector');
    
    const courseTitle = data.title;
    const code        = getCourseCode(courseTitle, profile.langOption);
    const _year       = parseInt(data.year);
    const year        = Number.isNaN(_year) ? void 0 : _year;
    const term        = isTerm(data.term) ? data.term : void 0;
    const _credit     = parseInt(data.credit);
    const credit      = isCredit(_credit) ? _credit : void 0;
    const grade       = data.grade;
    const _point      = parseInt(data.point);
    const min         = parseInt(data.minpoint);
    const max         = parseInt(data.maxpoint);
    
    const res = {
      courseTitle,
      course: { code, year, term, credit },
      ...(!(Number.isNaN(min) || Number.isNaN(max)) ? { point: [min, max], grade: void 0 }
          : isScoredGrade(grade) ? { grade, point: Number.isNaN(_point) ? void 0 : _point }
            : isUnscoredGrade(grade) ? { grade, point: void 0 }
              : { grade: void 0, point: void 0 }
      ),
    } satisfies PartialReport;
    return res;
  },
});

export const validatedReport = selector<InputReport | undefined>({
  key: 'dataflow-reports-validated',
  get: ({ get }) => {
    const { courseTitle, course: { code, year, term, credit }, point, grade } = get(partialReport);
    if (code == null || year == null || term == null || credit == null) return void 0;
    const course = { code, year, term, credit };
    if (grade == null) return point == null || point[0] > point[1] ? void 0 : { courseTitle, course, point };
    else if (isUnscoredGrade(grade)) return { courseTitle, course, grade };
    else return point == null ? void 0 : { courseTitle, course, grade, point };
  },
});

export const canSubmit = selector<boolean>({
  key: 'dataflow-reports-can-be-submit',
  get: ({ get }) => get(validatedReport) != null,
});

export const formProps = atom<{ scope?: Scope; defaultReport?: InputReport | UnenrolledSpecificReport } | undefined>({
  key    : 'dataflow-reports-form-props',
  default: void 0,
});

