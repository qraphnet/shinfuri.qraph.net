import { FC, FormEventHandler, Suspense }                    from 'react';
import { useRecoilCallback, useRecoilState, useRecoilValue } from 'recoil';
import { department, Department }                            from 'shinfuri/lib/department/index.js';
import { Rational }                                          from 'shinfuri/lib/rational.js';

import { avgPointState, zeroInclusion } from '../dataflow/calculation.js';
import {
  alteredState, departmentsForm, inputDepartments, selectedDepartments,
}                                       from '../dataflow/department-selected.js';

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
  return <div className='avg-list-config'>
    <label>
      0点算入
      <input type='checkbox' checked={ zero } onChange={ v => setZero(v.target.checked) }/>
    </label>
  </div>;
};

const format = (points: [Rational, Rational]) => {
  let d = 1;
  while (d < points[1].toNumber()) d *= 10;
  d            = Math.max(1, 100000 / d);
  const [l, u] = points.map(p => '' + (Math.round(p.mul(Rational.int(d)).toNumber()) / d));
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
  if (first == null || second == null || third == null) throw Error('profile required');
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
