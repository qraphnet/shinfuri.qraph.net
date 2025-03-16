import { FC, FormEventHandler, Suspense }                    from 'react';
import { useRecoilCallback, useRecoilState, useRecoilValue } from 'recoil';
import { department, Department }                            from 'shinfuri/lib/department/index.js';
import { Rational }                                          from 'shinfuri/lib/rational.js';

import { avgPointState, repetitionExclusion, zeroInclusion } from '../dataflow/calculation.js';
import {
  alteredState, departmentsForm, inputDepartments, selectedDepartments,
}                                                            from '../dataflow/department-selected.js';
import { profileState }                                      from '../dataflow/profile';
import { field }                                             from '../dataflow/util.ts';

import './avg-list.css';

export const AvgList: FC = () => {
  const selected = useRecoilValue(selectedDepartments);
  
  return <div className='avg-list'>
    <Config/>
    <DepartmentSelect selected={ selected }/>
    { Array.from(selected).map(d => <AvgCard key={ d } department={ d }/>) }
  </div>;
};

const Config: FC = () => {
  const [zero, setZero] = useRecoilState(zeroInclusion);
  
  const lastRepetition                  = useRecoilValue(field(profileState, 'lastRepetition'));
  const [repExclusion, setRepExclusion] = useRecoilState(repetitionExclusion);
  
  return <div className='avg-list-config'>
    {
      lastRepetition != null && lastRepetition.kind == '降年' ? <label>
        <input type='checkbox' checked={ repExclusion } onChange={ v => setRepExclusion(v.target.checked) }/>
        2S基礎科目除外
        <span className='description'>降年した場合，Aセメスターの成績発表時にUTASで表示される基本平均点は，2Sの基礎科目を除外して計算されます．</span>
      </label> : null
    }
    <label>
      <input type='checkbox' checked={ zero } onChange={ v => setZero(v.target.checked) }/>
      0点算入
      <span className='description'>欠席，未履修の科目を含めて計算することを当サイトでは「0点算入」と呼びます．UTASで確認できる基本平均点は0点算入アリです．</span>
    </label>
  </div>;
};

const format = (points: [Rational, Rational]) => {
  let d = 1;
  while (d < points[1].toNumber()) d *= 10;
  d            = Math.max(1, 100000 / d);
  const [l, u] = points.map(p => '' + (Math.floor(p.mul(Rational.int(d)).toNumber()) / d));
  const lsplit = l.split('.');
  const usplit = u.split('.');
  return <>
    { lsplit.length == 1 ? <span>{ lsplit[0] }</span> : <span>{ lsplit[0] }<span className='fraction'>.{ lsplit[1] }</span></span> }
    〜
    { usplit.length == 1 ? <span>{ usplit[0] }</span> : <span>{ usplit[0] }<span className='fraction'>.{ usplit[1] }</span></span> }
  </>;
};

const AvgCard: FC<{ department: Department }> = ({ department }) => {
  const first  = useRecoilValue(avgPointState({ department, phase: 1 }));
  const second = useRecoilValue(avgPointState({ department, phase: 2 }));
  const third  = useRecoilValue(avgPointState({ department, phase: 3 }));
  if (first == null || second == null || third == null) return <div className='avg-card'>
    <h2>{ department }</h2>
    <p>成績を入力してください</p>
  </div>;
  return <div className='avg-card'>
    <h2>{ department }</h2>
    <ol>
      <li>{ format(first) }</li>
      <li>{ format(second) }</li>
      <li>{ format(third) }</li>
    </ol>
  </div>;
};

const DepartmentSelect: FC<{ selected: Set<Department> }> = ({ selected }) => {
  const tree = genDepartmentTree(new Set(department));
  const Form = useRecoilValue(departmentsForm);
  
  const submitHandler = useRecoilCallback(
    ({ snapshot, set }): FormEventHandler<HTMLFormElement> =>
      e => {
        e.preventDefault();
        
        snapshot.getPromise(inputDepartments).then(data => {
          set(selectedDepartments, data);
        });
      },
    [],
  );
  
  
  return <details className='department-select'>
    <summary>表示する進学単位</summary>
    <Form onSubmit={ submitHandler }>
      <DepartmentSelectInternal tree={ tree } selected={ selected }/>
      <Suspense><Save/></Suspense>
    </Form>
  </details>;
};

const Save: FC = () => {
  const altered = useRecoilValue(alteredState);
  return altered && <button type='submit'>保存</button>;
};

const DepartmentSelectInternal: FC<{ tree: DepartmentTree; selected: Set<Department> }> = ({ tree, selected }) => {
  return <div>
    { Object.entries(tree).map(([division, value]) => 'string' === typeof value
      ? <label key={ value }>
        <input type='checkbox' name={ value } defaultChecked={ selected.has(value) }/>
        { division }
      </label>
      : <details key={ division }>
        <summary>{ division }</summary>
        <DepartmentSelectInternal tree={ value } selected={ selected }/>
      </details>,
    ) }
  </div>;
};

type DepartmentTree = { [K: string]: Department | DepartmentTree; };
const genDepartmentTree = (list: Set<Department>) => {
  const map: DepartmentTree = {};
  for (const dep of list) {
    const path = dep.split('/');
    
    path.slice(0, -1).reduce((a, c) => {
      if (!(c in a)) a[c] = {};
      if ('string' == typeof a[c]) throw Error('invalid department list');
      return a[c];
    }, map)[path[path.length - 1]] = dep;
  }
  return map;
};
