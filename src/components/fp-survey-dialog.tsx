import { FC, useEffect, useRef }                             from 'react';
import { atom, selector, useRecoilCallback, useRecoilValue } from 'recoil';
import { calculate, calculateFP, makeTicket }                from 'shinfuri';
import { isSubcourseOf }                                     from 'shinfuri/lib/course-code';
import { ScoredReport, UnscoredReport }                      from 'shinfuri/lib/report.js';
import { grouping }                                          from 'shinfuri/lib/type-utils';

import { SurveyAnswer } from '../../functions/api/floating-point-survey.ts';

import { canSubmit, fpSurveyForm, validated } from '../dataflow/fp-survey.ts';
import { profileState }                       from '../dataflow/profile';
import { InputReport, reportCardState }       from '../dataflow/reports';
import { field }                              from '../dataflow/util.ts';

import './fp-survey-dialog.css';

export const openState = atom({
  key    : 'components/fp-survey-dialog-open',
  default: false,
});

const ticketState = selector({
  key: 'components/fp-survey-dialog-ticket',
  get: ({ get }) => {
    const profile  = get(profileState);
    const _reports = get(reportCardState);
    if (profile == null || _reports.length == 0) return void 0;
    
    const { karui, langOption, lastRepetition, classNum } = profile;
    
    const group = grouping[karui][classNum];
    
    let reports: InputReport[];
    if (new Date().getMonth() + 1 < 6 && lastRepetition != null && lastRepetition.kind == '降年') {
      const isFc = isSubcourseOf('FC');
      reports    = _reports.filter(r => !(isFc(r.course.code) && r.course.year == lastRepetition.year));
    } else {
      reports = Array.from(_reports);
    }
    
    return makeTicket(reports.filter((r): r is ScoredReport | UnscoredReport => !(r.point instanceof Array)), {
      karui,
      group,
      langOption,
      department: '基本平均点',
      phase     : 1,
      exclude   : [],
      lastRepetition,
    });
  },
});

export const SurveyDialog: FC = () => {
  const ref  = useRef<HTMLDialogElement>(null);
  const rref = useRecoilCallback(({ set }) => {
    let cleanup: () => void;
    return (node: HTMLDialogElement | null) => {
      if (node == null) {
        cleanup?.();
        return;
      }
      
      const controller = new AbortController;
      
      node.addEventListener('close', () => {
        set(openState, false);
      }, { signal: controller.signal });
      
      (ref as any).current = node;
      
      cleanup = () => {
        controller.abort();
      };
    };
  }, []);
  
  const Form   = useRecoilValue(fpSurveyForm);
  const open   = useRecoilValue(openState);
  const ticket = useRecoilValue(ticketState);
  
  useEffect(() => {
    if (open) ref.current?.showModal();
  }, [open]);
  
  const submit = useRecoilCallback(({ snapshot }) => async () => {
    const input = await snapshot.getPromise(validated);
    if (input != null) {
      ref.current?.close();
      
      let data: SurveyAnswer;
      if (input.which == 'neither') {
        if (input.send) {
          const [profile, reports] = await Promise.all([snapshot.getPromise(profileState), snapshot.getPromise(reportCardState)]);
          data                     = { which: 'neither', actual: input.actual, data: { profile, reports } };
        } else {
          data = {
            which : 'neither',
            actual: input.actual,
            data  : { rational: calculate(ticket!).toNumber(), fp: calculateFP(ticket!).toNumber() },
          };
        }
      } else {
        data = { which: input.which };
      }
      await fetch('/api/floating-point-survey', {
        method : 'post',
        body   : JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }, []);
  
  if (ticket == null) return null;
  
  const rational   = calculate(ticket).toNumber();
  const fp         = calculateFP(ticket).toNumber();
  const diffenrent = Math.floor(rational * 1000) != Math.floor(fp * 1000);
  
  return ticket && <dialog ref={ rref } className='fp-survey-dialog'>
    <Form onSubmit={ submit }>
      当サイトの精度向上の為に，ご回答願います．
      <fieldset>
        UTASで確認できる基本平均点と一致するのは：
        { diffenrent
          ? <label><input type='radio' name='which' value='no-difference'/>{ calculate(ticket).toNumber() }</label>
          : <>
            <label><input type='radio' name='which' value='rational'/>{ calculate(ticket).toNumber() }</label>
            <label><input type='radio' name='which' value='floating-point'/>{ calculateFP(ticket).toNumber() }</label>
          </>
        }
        <label><input type='radio' name='which' value='neither'/>いずれも一致しない</label>
      </fieldset>
      <Neither/>
      <Submit/>
    </Form>
  </dialog>;
};

const Neither: FC = () => {
  const which = useRecoilValue(field(validated, 'which'));
  
  if (which != 'neither') return null;
  else {
    return <>
      <fieldset>
        <label>
          正確には：
          <input name='actual' type='number' min={ 0 } max={ 100 }/>
        </label>
      </fieldset>
      <fieldset>
        改善の為に，成績情報を収集してもよろしいですか？
        <label>
          <input name='send-scores' type='radio' value='yes'/>
          はい
        </label>
        <label>
          <input name='send-scores' type='radio' value='no'/>
          いいえ
        </label>
      </fieldset>
    </>;
  }
};

const Submit: FC = () => {
  const valid = useRecoilValue(canSubmit);
  return <button type='submit' disabled={ !valid }>送信</button>;
};
