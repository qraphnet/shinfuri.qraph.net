import { atom, RecoilValueReadOnly, selector } from 'recoil';
import { Options as CalcOptions }              from 'shinfuri';
import { Department }                          from 'shinfuri/lib/department/index.js';
import { Phase }                               from 'shinfuri/lib/type-utils.js';

import { generateTicket, repetitionExclusion, zeroInclusion } from './calculation.js';
import { profileState }                                       from './profile/index.js';
import { reportCardState, weighting }                         from './reports/index.js';

export const departmentState = atom<Department>({
  key    : 'dataflow-calc-detail-department',
  default: '基本平均点',
});

export const phaseState = atom<Phase>({
  key    : 'dataflow-calc-detail-phase',
  default: 1,
});

export const weightingState = atom<number>({
  key    : 'dataflow-calc-detail-weighting',
  default: 0.5,
});

export type TicketWeightReport = ((typeof ticketState) extends RecoilValueReadOnly<infer T | undefined> ? T : never)['weights'][number]['report'];
export const ticketState = selector({
  key: 'dataflow-calc-detail-ticket',
  get: ({ get }) => {
    const profile = get(profileState);
    const reports = get(reportCardState);
    if (profile == null || reports.length == 0) return void 0;
    
    const department = get(departmentState);
    const phase      = get(phaseState);
    const weight     = get(weightingState);
    
    const exclude: CalcOptions['exclude'] = get(zeroInclusion) ? [] : ['未履修', '欠席'];
    
    return generateTicket(weighting(reports, weight), profile, department, phase, exclude, get(repetitionExclusion));
  },
});