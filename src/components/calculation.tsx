import { FC, memo, ReactNode }                                      from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState }        from 'recoil';
import { calculate, engPoint, sumWeightedCredit, sumWeightedPoint } from 'shinfuri';
import { getTitle, Scope }                                          from 'shinfuri/lib/course-code.js';
import { department }                                               from 'shinfuri/lib/department/index.js';
import { Weighted }                                                 from 'shinfuri/lib/weights.js';

import {
  departmentState, phaseState, ticketState, TicketWeightReport, weightingState,
}                                             from '../dataflow/calculation-detail.js';
import { repetitionExclusion, zeroInclusion } from '../dataflow/calculation.ts';
import { courseTreeState, depth }             from '../dataflow/course-tree.js';
import { profileState }                       from '../dataflow/profile';
import { formProps }                          from '../dataflow/reports/form.js';
import { field }                              from '../dataflow/util.ts';

import { Rows } from './table.js';

import './calculation.css';

export const Calculation = () => {
  const ticket    = useRecoilValue(ticketState);
  const tree      = useRecoilValue(courseTreeState);
  const sideWidth = depth(tree);
  
  if (ticket == null) return <div>成績を入力してください。</div>;
  
  const eng             = ticket.avgType === '工学';
  const weightedCredits = sumWeightedCredit(ticket.weights);
  const weightedPoints  = sumWeightedPoint(ticket.weights, eng);
  
  return <div className='calculation'>
    <Config/>
    <dl>
      <div>
        <dt>Σ単位×重率</dt>
        <dd>{ weightedCredits.toNumber() }</dd>
      </div>
      <div>
        <dt>Σ評点×単位×重率</dt>
        <dd>{ weightedPoints.toNumber() }</dd>
      </div>
      <div>
        <dt>基本平均点</dt>
        <dd>{ weightedPoints.div(weightedCredits).toNumber() }</dd>
      </div>
      { ticket.factor && <div>
        <dt>修得単位数</dt>
        <dd>{ ticket.factor.toNumber() }</dd>
      </div> }
      <div>
        <dt>履修点</dt>
        <dd>{ ticket.additionalPoint.reduce((a, c) => a + c.point * (c.valid ? 1 : 0), 0) }</dd>
      </div>
      <div>
        <dt>平均点</dt>
        <dd>{ calculate(ticket).toNumber() }</dd>
      </div>
    </dl>
    <div className='table-container'>
      <table>
        <thead>
        <tr>
          <th colSpan={ sideWidth }>科目区分</th>
          <th>科目名</th>
          <th>年度</th>
          <th>ターム</th>
          <th>成績</th>
          <th>評点</th>
          { eng && <th>工学部評点</th> }
          <th>単位</th>
          <th>重率</th>
          <th>単位×重率</th>
          <th>評点×単位×重率</th>
          <th>付記</th>
        </tr>
        </thead>
        <tbody>
          <Rows values={ ticket.weights } tree={ tree } mapper={ mapper } rowCounter={ counter } th={ Th } row={ Row(eng) }/>
        </tbody>
      </table>
    </div>
    <table>
      <caption>履修点</caption>
      <thead>
      <tr>
        <th>科目名</th>
        <th>履修点</th>
        <th>効力</th>
      </tr>
      </thead>
      <tbody>
      { ticket.additionalPoint.map(p => <tr>
        <td>{ p.report.courseTitle ?? getTitle(p.report.course.code) }</td>
        <td>{ p.point }</td>
        <td>{ p.valid ? '有効' : '無効' }</td>
      </tr>) }
      </tbody>
    </table>
  </div>;
};

const mapper = ({ report }: Weighted<TicketWeightReport>) => report.course != null ? report.course.code : report.scope;

const counter = (weight: Weighted<TicketWeightReport>) => weight.weights.length;

const Th: FC<
  { colSpan?: number; rowSpan?: number; } & (
    { name: string; scope: Scope } |
    { name?: undefined; scope?: undefined }
  )
> = ({ name, scope, ...rest }) => {
  const f = useSetRecoilState(formProps);
  return <th { ...rest }>{ scope && <button onClick={ () => { f({ scope }); } }>{ name }</button> }</th>;
};

const Row: (eng: boolean) => FC<{ value?: Weighted<TicketWeightReport>, children: ReactNode }> = eng =>
  ({ value, children }) => {
    if (value == null) return <tr>{ children }
      <td colSpan={ eng ? 11 : 10 }/>
    </tr>;
    const { report, weights } = value;
    return <>
      <tr>
        { children }
        <CourseCells row={ weights.length } report={ report }/>
        <td rowSpan={ weights.length }>{ report.grade }</td>
        <td rowSpan={ weights.length } className='num-col'>{ report.point }</td>
        { eng && <td rowSpan={ weights.length } className='num-col'>{ engPoint(report.point) }</td> }
        <WeightCells point={ eng ? engPoint(report.point) : report.point } weight={ weights[0] }/>
      </tr>
      { weights[1] && <tr><WeightCells point={ report.point } weight={ weights[1] }/></tr> }
    </>;
  };

const CourseCells: FC<{ row: number; report: TicketWeightReport }> = ({ row, report }) => {
  const f       = useSetRecoilState(formProps);
  const onClick = 'original' in report ? () => f({ defaultReport: report.original })
    : report.course == null ? () => f({ scope: report.scope })
      : () => f({ defaultReport: report });
  
  // @ts-ignore
  const { courseTitle, course } = report;
  return <>
    <td rowSpan={ row }>
      <button onClick={ onClick }>{ courseTitle ?? (course == null ? '----' : getTitle(course.code)) }</button>
    </td>
    <td rowSpan={ row }>{ course != null && 'year' in course ? course.year : '----' }</td>
    <td rowSpan={ row }>{ course != null && 'term' in course ? course.term : '--' }</td>
  </>;
};

type Weight = Weighted<any>['weights'][number];
const WeightCells: FC<{ point: number; weight: Weight }> = ({ point, weight: { credit, value, expls } }) => <>
  <td className='num-col'>{ credit }</td>
  <td className='num-col'>{ value }</td>
  <td className='num-col'>{ credit * (value * 10) / 10 }</td>
  <td className='num-col'>{ point * credit * (value * 10) / 10 }</td>
  <td className='expl'>{ expls.map(expl => `${ expl.description }（${ expl.references.join(', ') }）`).join('，') }</td>
</>;

const Config: FC        = () => {
  const [dep, setDep]     = useRecoilState(departmentState);
  const [phase, setPhase] = useRecoilState(phaseState);
  const [wei, setWei]     = useRecoilState(weightingState);
  const [zero, setZero]   = useRecoilState(zeroInclusion);
  
  const lastRepetition                  = useRecoilValue(field(profileState, 'lastRepetition'));
  const [repExclusion, setRepExclusion] = useRecoilState(repetitionExclusion);
  
  return <div className='calculation-config'>
    <label>
      進学単位
      <select value={ dep } onChange={ v => setDep(v.target.value as any) }>
        <DepartmentOptions/>
      </select>
    </label>
    <label>
      段階
      <select value={ phase } onChange={ v => setPhase(+v.target.value as any) }>
        <option value='1'>1</option>
        <option value='2'>2</option>
        <option value='3'>3</option>
      </select>
    </label>
    {
      lastRepetition != null && lastRepetition.kind == '降年' ? <label>
        <input type='checkbox' checked={ repExclusion } onChange={ v => setRepExclusion(v.target.checked) }/>
        2S基礎科目除外
      </label> : null
    }
    <label>
      <input type='checkbox' checked={ zero } onChange={ v => setZero(v.target.checked) }/>
      0点算入
    </label>
    <label>
      皮算用
      <input type='range' value={ wei * 100 | 0 } onChange={ v => setWei(+v.target.value / 100) }/>
      { wei * 100 | 0 }%
    </label>
  </div>;
};
const DepartmentOptions = memo(() => department.map(d => <option key={ d } value={ d }>{ d }</option>));
