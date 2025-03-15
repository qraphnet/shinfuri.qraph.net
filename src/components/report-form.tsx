import { FC, Suspense, useMemo, useState } from 'react';
import { useRecoilValue }                  from 'recoil';

import { getCourseCodeMap, getTitle }                              from 'shinfuri/lib/course-code.js';
import { termList }                                                from 'shinfuri/lib/course.js';
import { gradeRange, isUnscoredGrade, scoredGrade, unscoredGrade } from 'shinfuri/lib/report.js';

import { canSubmit, formProps, partialReport, reportForm } from '../dataflow/reports/form.js';
import { field }                                           from '../dataflow/util.js';

const theYear = (() => {
  const date = new Date();
  date.setMonth(date.getMonth() - 3);
  
  return date.getFullYear();
})();

export const ReportForm: FC<JSX.IntrinsicElements['form']> = props => {
  const Form                     = useRecoilValue(reportForm);
  const { scope, defaultReport } = useRecoilValue(formProps) ?? {};
  
  const dr   = defaultReport == null
    ? void 0
    : defaultReport.grade == '未履修'
      ? { ...defaultReport, courseTitle: void 0, course: { ...defaultReport.course, year: void 0, term: void 0 } }
      : defaultReport;
  const list = useMemo(() =>
      Object.entries(getCourseCodeMap()).filter(([code]) => scope == null || scope.match(code as any))
    , [scope]);
  
  const defaultTitle = defaultReport && (dr?.courseTitle ?? getTitle(defaultReport.course.code));
  return <Form { ...props }>
    <fieldset>
      <legend>科目</legend>
      <label>
        科目名
        <select name='title' defaultValue={ defaultTitle }>
          {
            list.flatMap(([code, titles]) => titles.map(title =>
              <option key={ `${ code }/${ title }` } value={ title }>{ title }</option>,
            ))
          }
        </select></label>
      <label>
        開講年度
        <input type='number' name='year' min={ 2000 } step={ 1 } defaultValue={ dr?.course.year ?? theYear }/>
      </label>
      <label>
        開講学期
        <select name='term' defaultValue={ dr?.course.term }>
          { termList.map(t => <option key={ t } value={ t }>{ t }</option>) }
        </select>
      </label>
      <label>
        単位
        <input type='number'
               name='credit'
               min={ 1 }
               max={ 2 }
               step={ 1 }
               defaultValue={ defaultReport?.course.credit ?? 2 }/>
      </label>
    </fieldset>
    <fieldset>
      <legend>成績</legend>
      <label>
        評語
        <select name='grade' defaultValue={ defaultReport?.grade }>
          <option/>
          { unscoredGrade.map(g => <option key={ g } value={ g }>{ g }</option>) }
          { scoredGrade.map(g => <option key={ g } value={ g }>{ g }</option>) }
        </select>
      </label>
      <Suspense><PointInput defaultValue={ defaultReport?.point }/></Suspense>
    </fieldset>
    <Submit/>
  </Form>;
};

const PointInput: FC<{ defaultValue?: number | [number, number] }> = ({ defaultValue: point }) => {
  const [chickenbone, setChickenbone] = useState(point instanceof Array);
  const grade                         = useRecoilValue(field(partialReport, 'grade'));
  const disabled                      = isUnscoredGrade(grade);
  
  const createInput = (name: string, defaultPoint?: number) => grade == null ?
    <input type='number' name={ name } min={ 0 } max={ 100 } step={ 1 } defaultValue={ defaultPoint }/> :
    isUnscoredGrade(grade) ?
      <input type='number' name={ name } disabled defaultValue={ defaultPoint }/> :
      <input type='number' name={ name } { ...gradeRange[grade] } step={ 1 } defaultValue={ defaultPoint }/>
  ;
  
  return <>
    <label>
      <input type='checkbox'
             checked={ chickenbone && !disabled }
             onChange={ e => setChickenbone(e.target.checked) }
             disabled={ disabled }/>
      皮算用
    </label>
    <label>
      評点：
      {
        chickenbone
          ? <>{ createInput('minpoint', point instanceof Array ? point[0] : point) }〜{ createInput('maxpoint', point instanceof Array ? point[1] : point) }</>
          : createInput('point', point instanceof Array ? void 0 : point)
      }
    </label>
  </>;
};

const Submit: FC = () => {
  const valid = useRecoilValue(canSubmit);
  return <button type='submit' disabled={ !valid }>保存</button>;
};
