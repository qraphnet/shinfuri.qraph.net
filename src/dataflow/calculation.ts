import { atom, selectorFamily }                                             from 'recoil';
import { calculate, CalculationTicket, makeTicket, Options as CalcOptions } from 'shinfuri';
import { Department }                                                       from 'shinfuri/lib/department/index.js';
import { Rational }                                                         from 'shinfuri/lib/rational.js';
import { grouping, Phase }                                                  from 'shinfuri/lib/type-utils.js';

import { profileState }                                         from './profile/index.js';
import { Fixed, highest, InputReport, lowest, reportCardState } from './reports/index.js';

export const zeroInclusion = atom<boolean>({
  key    : 'dataflow-zero-inclusion',
  default: true,
});

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
    
    const zero = get(zeroInclusion);
    
    const { karui, langOption, lastRepetition, classNum } = profile;
    const group                                           = grouping[karui][classNum];
    const exclude: CalcOptions['exclude']                 = zero ? [] : ['未履修', '欠席'];
    
    return [
      makeTicket(lowest(reports), { karui, group, langOption, department, phase, exclude, lastRepetition }),
      makeTicket(highest(reports), { karui, group, langOption, department, phase, exclude, lastRepetition }),
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
