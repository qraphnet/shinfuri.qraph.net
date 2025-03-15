import { atom, selector } from 'recoil';

import { Profile, profileState }       from './profile/index.js';
import { ReportCard, reportCardState } from './reports/index.js';

export type PageStatus =
  | { status: 'profile'; profile?: Profile; }
  | { status: 'reports'; profile: Profile; }
  | { status: 'ordinary'; profile: Profile; reports: ReportCard; }
  ;

export const pageState = selector<PageStatus>({
  key: 'dataflow-page',
  get: ({ get }) => {
    const profile     = get(profileState);
    const openProfile = get(openProfileForm);
    if (profile == null || openProfile) return { status: 'profile', profile };
    
    const reports = get(reportCardState);
    if (reports.length == 0) return { status: 'reports', profile };
    
    return { status: 'ordinary', profile, reports };
  },
});

export const openProfileForm = atom<boolean>({
  key    : 'dataflow-page-open-profile-form',
  default: false,
});

