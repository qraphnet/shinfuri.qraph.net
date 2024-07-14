import { Options as CalcOptions, makeTicket } from 'shinfuri';
import { Phase, grouping } from 'shinfuri/lib/type-utils.js';
import { Department } from 'shinfuri/lib/department/index.js';

import { atom, RecoilValueReadOnly, selector } from 'recoil';

import {weighting, reportCardState} from './reports/index.js';
import {zeroInclusion} from './calculation.js';
import {profileState} from './profile/index.js';

export const departmentState = atom<Department>({
  key: 'dataflow-calc-detail-department',
  default: '基本平均点',
});

export const phaseState = atom<Phase>({
  key: 'dataflow-calc-detail-phase',
  default: 1,
});

export const weightingState = atom<number>({
  key: 'dataflow-calc-detail-weighting',
  default: 0.5,
});

export type TicketWeightReport = ((typeof ticketState) extends RecoilValueReadOnly<infer T | undefined> ? T : never)['weights'][number]['report'];
export const ticketState = selector({
  key: 'dataflow-calc-detail-ticket',
  get: ({ get }) => {
    const profile = get(profileState);
    if (profile == null) return void 0;
    const reports = get(reportCardState);

    const department = get(departmentState);
    const phase = get(phaseState);
    const weight = get(weightingState);
    const zero = get(zeroInclusion);

    const { karui, langOption, lastRepetition, classNum } = profile;
    const group = grouping[karui][classNum];
    const exclude: CalcOptions['exclude'] = zero ? [] : ['未履修', '欠席'];

    return makeTicket(weighting(reports, weight), { karui, group, langOption, department, phase, exclude, lastRepetition });
  },
});

// export const avgPointState = selector<Rational | undefined>({
//   key: 'dataflow-calc-detail-avg-point',
//   get: ({ get }) => {
//     const ticket = get(ticketState);
//     if (ticket == null) return void 0;
// 
//     return calculate(ticket);
//   },
// });
