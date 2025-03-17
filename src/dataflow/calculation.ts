import { atom, selectorFamily }                                             from 'recoil';
import { calculate, CalculationTicket, makeTicket, Options as CalcOptions } from 'shinfuri';
import { isSubcourseOf }                                                    from 'shinfuri/lib/course-code.js';
import { Department }                                                       from 'shinfuri/lib/department/index.js';
import { Rational }                                                         from 'shinfuri/lib/rational.js';
import { grouping, Phase }                                                  from 'shinfuri/lib/type-utils.js';

import { Profile, profileState }                                from './profile/index.js';
import { Fixed, highest, InputReport, lowest, reportCardState } from './reports/index.js';

export const zeroInclusion = atom<boolean>({
  key    : 'dataflow-zero-inclusion',
  default: true,
});

export const repetitionExclusion = atom<boolean>({
  key    : 'dataflow-repetition-exclusion',
  default: new Date().getMonth() + 1 < 6,
});

// ref: https://www.c.u-tokyo.ac.jp/zenki/news/kyoumu/b22d51ae6664e3612e6f50a562d98df464b547e8.pdf    (2) ※4~6
// 協力により，2S2の実験は通常通り算入されることが分かった．
const repExcFilter = isSubcourseOf('FC813', 'FC823', 'FC850', 'FC888', 'FC891')
export const generateTicket = (reports: readonly Fixed<InputReport>[], profile: Profile, department: Department, phase: Phase, exclude: CalcOptions['exclude'], repEx: boolean) => {
  const { karui, langOption, lastRepetition, classNum } = profile;
  const group                                           = grouping[karui][classNum];
  
  let _reports: Fixed<InputReport>[];
  if (repEx && lastRepetition != null && lastRepetition.kind == '降年') {
    _reports   = reports.filter(r => !(repExcFilter(r.course.code) && r.course.year <= lastRepetition.year));
  } else {
    _reports = Array.from(reports);
  }
  
  return makeTicket(_reports, { karui, group, langOption, department, phase, exclude, lastRepetition });
};

type CalculationInit = {
  department: Department;
  phase: Phase;
}
export const ticketState = selectorFamily<[CalculationTicket<Fixed<InputReport>>, CalculationTicket<Fixed<InputReport>>] | undefined, CalculationInit>({
  key: 'dataflow-calculation-ticket',
  get: ({ department, phase }) => ({ get }) => {
    const profile = get(profileState);
    const reports = get(reportCardState);
    if (profile == null || reports.length == 0) return void 0;
    
    const exclude: CalcOptions['exclude'] = get(zeroInclusion) ? [] : ['未履修', '欠席'];
    
    return [
      generateTicket(lowest(reports), profile, department, phase, exclude, get(repetitionExclusion)),
      generateTicket(highest(reports), profile, department, phase, exclude, get(repetitionExclusion)),
    ];
  },
});

export const avgPointState = selectorFamily<[Rational, Rational] | undefined, CalculationInit>({
  key: 'dataflow-avg-point',
  get: init => ({ get }) => {
    const ticket = get(ticketState(init));
    if (ticket == null) return void 0;
    
    return ticket.map(calculate) as [Rational, Rational];
  },
});
