import { FC }                                       from 'react';
import { useSetRecoilState }                        from 'recoil';
import { CourseCode, getCourseCode, isSubcourseOf } from 'shinfuri/lib/course-code.js';
import { Course, Term }                             from 'shinfuri/lib/course.js';
import { pointToGrade }                             from 'shinfuri/lib/report.js';
import { LanguageOption }                           from 'shinfuri/lib/type-utils.js';
import { Profile }                                  from '../dataflow/profile';
import { InputReport, reportCardState }             from '../dataflow/reports';

import './report-prompt.css';

export const ReportPrompt: FC<{ profile: Profile }> = ({ profile }) => {
  const setReports = useSetRecoilState(reportCardState);
  const onClick    = async () => {
    exploitClipboard(profile.langOption).then(reports => {
      if (
        reports != null
        && window.confirm(reports.map(r => r.courseTitle).filter(t => t != null).join('，') + 'で上書きしますか？')
      ) {
        setReports(reports);
      }
    });
  };
  return <div className='report-prompt'>
    <button onClick={ onClick }>クリップボードから読み取る</button>
  </div>;
};

const exploitClipboard = async (languageOption: LanguageOption): Promise<InputReport[] | undefined> => {
  const items = await window.navigator.clipboard.read();
  for (const item of items) {
    if (item.types.includes('text/html')) {
      const blob  = await item.getType('text/html');
      const html  = await blob.text();
      const dom   = new DOMParser().parseFromString(html, 'text/html');
      const table = dom.querySelector('table');
      if (table == null) {
        alert('適切にコピーできていません');
        return;
      }
      
      // let head   = ['科目', '教員', '年度', '学期', '単位', '成績の原評価（点数）'];
      const rows = [];
      for (const row of table.rows) {
        if (row.cells.length != 6) continue;
        const cells = [...row.cells].map(cell => cell.textContent ?? '');
        
        if (!row.cells[0].classList.contains('seiseki-head')) rows.push(cells);
        // else head = cells;
      }
      
      return rows.filter(row => row[1] != '').map((row): InputReport | undefined => {
        const courseTitle = row[0].match(/^\s*＊?(.+)$/)?.[1];
        if (courseTitle == null) return;
        
        const code = getCourseCode(courseTitle, languageOption);
        if (code == null) return;
        
        const credit = row[4] == '' ? interpolateCredits(code) : +row[4];
        if (credit != 1 && credit != 2) return;
        
        const term = inferTerm(code, row[3], credit);
        if (term == null) return;
        
        const course: Course = {
          code, year: +row[2], term, credit,
        };
        
        const score = +row[5];
        if (Number.isNaN(score)) {
          return {
            courseTitle,
            course,
            grade: row[5] == 'G' ? '合格' : '不合格',
          };
        } else {
          const grade = pointToGrade(+row[5]);
          if (grade == null) return;
          return {
            courseTitle,
            course,
            grade,
            point: +row[5],
          };
        }
      }).filter(r => r != null);
    }
  }
};

const inferTerm = (code: CourseCode, term: string, credit: 1 | 2): Term | undefined => {
  const match = term.match(/^[12]([SA])([12])$/);
  if (match == null) return undefined;
  const [, sOrA, oneOrTwo] = match;
  
  // 実際には，週2コマの授業などもあるから必ずしも以下の実装は正しくないが， `infer` であるから許してほしい．
  if (oneOrTwo == '1') return sOrA == 'S' ? 'S1' : 'A1';
  else {
    if (credit == 1 && !isSubcourseOf('FC4', 'GCD41', 'GCD42', 'PGD10', 'PGD20')(code)) return sOrA == 'S' ? 'S2' : 'A2';
    return sOrA == 'S' ? 'S' : 'A';
  }
};

const interpolateCredits = (code: CourseCode): 1 | 2 | undefined => {
  switch (code) {
    case 'FC111':
    case 'FC112':
    case 'FC113':
      return 1;
    case 'FC114':
      return 2;
    case 'FC121':
    case 'FC122':
    case 'FC123':
    case 'FC129':
    case 'FC131':
    case 'FC132':
    case 'FC133':
    case 'FC139':
    case 'FC141':
    case 'FC142':
    case 'FC143':
    case 'FC149':
    case 'FC151':
    case 'FC152':
    case 'FC153':
    case 'FC159':
    case 'FC161':
    case 'FC162':
    case 'FC163':
    case 'FC169':
    case 'FC171':
    case 'FC172':
    case 'FC173':
    case 'FC179':
    case 'FC181':
    case 'FC182':
    case 'FC183':
    case 'FC189':
      return 2;
    case 'FC191':
    case 'FC192':
      return 2;
    case 'FC193':
    case 'FC194':
      return 1;
    case 'FC211':
    case 'FC212':
    case 'FC213':
    case 'FC219':
    case 'FC221':
    case 'FC222':
    case 'FC223':
    case 'FC229':
    case 'FC231':
    case 'FC232':
    case 'FC233':
    case 'FC239':
    case 'FC241':
    case 'FC242':
    case 'FC243':
    case 'FC249':
    case 'FC251':
    case 'FC252':
    case 'FC253':
    case 'FC259':
    case 'FC261':
    case 'FC262':
    case 'FC263':
    case 'FC269':
    case 'FC271':
    case 'FC272':
    case 'FC273':
    case 'FC279':
      return 2;
    case 'FC410':
    case 'FC420':
      return 1;
  }
};
