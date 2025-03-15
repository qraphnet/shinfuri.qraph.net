import type { FC, ReactNode }                from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { getTitle, Scope }                   from 'shinfuri/lib/course-code.js';
import { pointToGrade }                      from 'shinfuri/lib/report.js';

import { courseTreeState, depth }       from '../dataflow/course-tree.js';
import { Profile }                      from '../dataflow/profile';
import { formProps }                    from '../dataflow/reports/form.js';
import { InputReport, reportCardState } from '../dataflow/reports/index.js';

import { ReportPrompt } from './report-prompt.tsx';
import { Rows }         from './table.js';

import './reports-viewer.css';

export const Reports: FC<{ profile: Profile }> = ({ profile }) => {
  const reports   = useRecoilValue(reportCardState);
  const tree      = useRecoilValue(courseTreeState);
  const sideWidth = depth(tree);
  
  return <div className='report-view'>
    <table>
      <thead>
      <tr>
        <th colSpan={ sideWidth }>科目区分</th>
        <th>科目名</th>
        <th>年度</th>
        <th>ターム</th>
        <th>単位</th>
        <th>成績</th>
        <th>評点</th>
      </tr>
      </thead>
      <tbody>
      <Rows values={ reports } tree={ tree } mapper={ mapper } rowCounter={ counter } row={ Row } th={ Th }/>
      </tbody>
    </table>
    <ReportPrompt profile={ profile }/>
  </div>;
};

const mapper  = (report: InputReport) => report.course.code;
const counter = () => 1;

type ThProps =
  & { colSpan?: number; rowSpan?: number; }
  & ({ name: string; scope: Scope } | { name?: undefined; scope?: undefined })
  ;
const Th: FC<ThProps> = ({ name, scope, ...rest }) => {
  const f = useSetRecoilState(formProps);
  return <th { ...rest }>{ scope && <button onClick={ () => { f({ scope }); } }>{ name }</button> }</th>;
};

const Row: FC<{ value?: InputReport, children: ReactNode }> = ({ value, children }) => {
  const f = useSetRecoilState(formProps);
  
  if (value == null) return <tr>{ children }
    <td colSpan={ 6 }/>
  </tr>;
  else return <tr>
    { children }
    <td>
      <button onClick={ () => { f({ defaultReport: value }); } }>{ value.courseTitle ?? getTitle(value.course.code) }</button>
    </td>
    <td>{ value.course.year }</td>
    <td>{ value.course.term }</td>
    <td className='num-col'>{ value.course.credit }</td>
    <GradeCell report={ value }/>
    <PointCell point={ value.point }/>
  </tr>;
};

const GradeCell: FC<{ report: InputReport }> = ({ report: { grade, point } }) => {
  if (grade != null) return <td>{ grade }</td>;
  else if (point == null) return <td>--</td>;
  else {
    const [grade_, _grade] = point.map(pointToGrade);
    if (grade_ === _grade) return <td>{ grade_ }</td>;
    return <td>{ grade_ }~{ _grade }</td>;
  }
};

const PointCell: FC<{ point: InputReport['point'] }> = ({ point }) => {
  if (point == null) return <td>--</td>;
  if ('number' === typeof point) return <td className='num-col'>{ point }</td>;
  return <td>{ point.join('~') }</td>;
};
