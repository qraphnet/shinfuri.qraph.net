import { FC, FormEventHandler, Suspense }    from 'react';
import { useRecoilCallback, useRecoilValue } from 'recoil';

import {
  classNumList, karuiJa, kishuForeignLangList, languageCodeMap, LanguageOption, shohuForeignLangList,
} from 'shinfuri/lib/type-utils.js';

import { openProfileForm }                 from '../dataflow/page.ts';
import { isValid, profileForm, validated } from '../dataflow/profile/form.js';
import { Profile, profileState }           from '../dataflow/profile/index.ts';
import { field }                           from '../dataflow/util.js';

import './profile-form.css'

export const ProfileForm: FC<{ profile?: Profile }> = ({ profile }) => {
  const Form = useRecoilValue(profileForm);
  
  const submitHandler = useRecoilCallback(
    ({ snapshot, set }): FormEventHandler<HTMLFormElement> =>
      e => {
        e.preventDefault();
        
        snapshot.getPromise(validated).then(data => {
          set(profileState, {
            karui         : data.karui!,
            classNum      : data.classNum!,
            lastRepetition: data.lastRepetition,
            langOption    : {
              firstForeignLanguage : data.first!,
              secondForeignLanguage: { lang: data.second!, learned: data.learned! },
            } as LanguageOption,
          });
          set(openProfileForm, false);
        });
      },
    [],
  );
  
  return <Form onSubmit={ submitHandler } className='profile-form'>
    <fieldset>
      <legend>所属</legend>
      <label>
        科類：
        <select name='karui' defaultValue={ profile?.karui }>
          { Object.entries(karuiJa).map(([karui, text]) => <option key={ karui } value={ karui }>{ text }</option>) }
        </select>
      </label>
      <label>
        組：
        <select name='classNum' defaultValue={ profile?.classNum }>
          <Suspense><ClassNumOption/></Suspense>
        </select>
      </label>
    </fieldset>
    <fieldset>
      <legend>既修外国語</legend>
      <label>
        言語：
        <select name='first' defaultValue={ profile?.langOption.firstForeignLanguage ?? 'en' }>
          { kishuForeignLangList.map(l => <option key={ l } value={ l }>{ languageCodeMap[l] }</option>) }
        </select>
      </label>
    </fieldset>
    <fieldset>
      <legend>初修外国語</legend>
      <label>
        言語：
        <select name='second' defaultValue={ profile?.langOption.secondForeignLanguage.lang }>
          <Suspense><SecondLangOption/></Suspense>
        </select>
      </label>
      <label>
        <input type='checkbox' name='learned' defaultChecked={ profile?.langOption.secondForeignLanguage.learned }/>
        既修相当
      </label>
    </fieldset>
    <fieldset>
      <legend>留年・降年</legend>
      <label>
        最後にしたのは：
        <select name='kind' defaultValue={ profile?.lastRepetition?.kind }>
          <option>したことない</option>
          <option value='留年'>留年</option>
          <option value='降年'>降年</option>
        </select>
      </label>
      <label>
        それが確定した年度：
        <input type='number' name='year' defaultValue={ profile?.lastRepetition?.year } min={ 2000 } step={ 1 }/>
      </label>
    </fieldset>
    <Suspense>
      <Submit/>
    </Suspense>
  </Form>;
};

const ClassNumOption: FC = () => {
  const karui = useRecoilValue(field(validated, 'karui'));
  const max   = karui == null ? 39 : classNumList[karui];
  return new Array(max).fill(0).map((_, i) => <option key={ i } value={ i + 1 }>{ i + 1 }</option>);
};

const SecondLangOption: FC = () => {
  const learned = useRecoilValue(field(validated, 'learned'));
  return (!learned ? shohuForeignLangList : kishuForeignLangList).map(l =>
    <option key={ l } value={ l }>{ languageCodeMap[l] }</option>,
  );
};

const Submit: FC = () => {
  const valid = useRecoilValue(isValid);
  
  return <button type='submit' disabled={ !valid }>保存</button>;
};
