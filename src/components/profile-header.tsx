import { languageCodeMap, karuiJa } from 'shinfuri/lib/type-utils.js';

import {FC} from "react";
import {useRecoilValue, useSetRecoilState} from "recoil";

import {profileState} from "../dataflow/profile/index.js";
import {openProfileForm} from "../dataflow/page.js";

import "./profile-header.css";

export const ProfileHeader: FC = () => {
  const profile = useRecoilValue(profileState);
  const setOpen = useSetRecoilState(openProfileForm);
  if (profile == null) return <header>Whoa!</header>
  const {
    karui,
    classNum,
    lastRepetition,
    langOption: {
      firstForeignLanguage: first,
      secondForeignLanguage: { lang: second, learned },
    },
  } = profile;

  return <header className='profile-header'>
    <dl>
      <dt>所属</dt>
      <dd>{karuiJa[karui]}{classNum}組</dd>
      <dt>既修外国語</dt>
      <dd>{languageCodeMap[first]}</dd>
      <dt>初修外国語</dt>
      <dd>{languageCodeMap[second]}{ learned ? '（既修相当）' : null }</dd>
      <dt>留年・降年</dt>
      <dd>
        { lastRepetition == null ? 'なし'
          : lastRepetition.kind == '留年' ? `${lastRepetition.year}年度から${lastRepetition.year+1}年度にかけて留年`
            : `${lastRepetition.year}年度に降年` }
      </dd>
    </dl>
    <button onClick={() => setOpen(true)}>変更する</button>
  </header>;
};


