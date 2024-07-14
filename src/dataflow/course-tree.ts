import { Scope } from 'shinfuri/lib/course-code.js';
import { Quota } from 'shinfuri/lib/quota/definition.js';
import { generateRequirements } from 'shinfuri/lib/quota/shuryo.js';

import { selector } from 'recoil';

import { profileState } from './profile/index.js';

export type CourseTreeNode = {
  name: string;
  scope: Scope;
  sub?: CourseTree;
};
export type CourseTree = CourseTreeNode[];
export const depth = (tree: CourseTree): number => {
  if (tree.length === 0) return 0;
  return Math.max(0, ...tree.map(({ sub }) => (sub == null ? 1 : depth(sub) + 1)));
};
const fromQuota: (quota: Quota) => CourseTreeNode = ({ name, scope, subQuotas }) => {
  return { name, scope, sub: subQuotas.length === 0 ? void 0 : subQuotas.map(fromQuota) };
}

export const courseTreeState = selector<CourseTree>({
  key: 'dataflow-course-tree',
  get: ({ get }) => {
    const profile = get(profileState);
    if (profile == null) return [{ name: '全て', scope: new Scope(['']) }];
    const { karui, langOption } = profile
    const req = generateRequirements({ karui, langOption, forCalculation: false });
    return req.quotas.map(fromQuota);
  },
});
