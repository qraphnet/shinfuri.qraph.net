import { FC }             from 'react';
import { useRecoilValue } from 'recoil';

import { pageState }   from '../dataflow/page';
import { Main }        from './main-page.js';
import { ProfileForm } from './profile-form.js';

export const Root: FC = () => {
  const pageStatus = useRecoilValue(pageState);
  
  switch (pageStatus.status) {
    case 'profile':
      return <ProfileForm profile={ pageStatus.profile }/>;
    case 'reports':
    case 'ordinary':
      return <Main profile={ pageStatus.profile }/>;
  }
};
