import { atom }                                       from 'recoil';
import { courseCodeToInt }                            from 'shinfuri/lib/course-code.js';
import { Course }                                     from 'shinfuri/lib/course.js';
import { pointToGrade, ScoredReport, UnscoredReport } from 'shinfuri/lib/report.js';

import { localStorage } from '../../local-storage.js';

export interface RangedReport {
  course: Course;
  grade?: undefined;
  point: [number, number];
}

const isRanged = <R extends ScoredReport | UnscoredReport | RangedReport>(report: R): report is (R & RangedReport) => {
  return report.point instanceof Array;
};

export interface Titled {
  courseTitle?: string;
}

export type InputReport = (ScoredReport | UnscoredReport | RangedReport) & Titled;
export type Fixed<R extends ScoredReport | UnscoredReport | RangedReport> =
  R extends RangedReport & infer T ? ScoredReport & T & { original: RangedReport } : R

export type ReportCard = InputReport[];

export const weighting = <R extends InputReport>(card: R[], weight: number): Fixed<R>[] => card.map(r => {
  if (!isRanged(r)) return r as Fixed<R & RangedReport>;
  else {
    const { course, point: [point0, point1], ...rest } = r;
    const point                                        = Math.round(point0 * (1 - weight) + point1 * weight);
    const grade                                        = pointToGrade(point);
    if (grade == null) throw Error('invalid point');
    return { course, grade, point, ...rest, original: r };
  }
});
export const lowest    = <R extends InputReport>(card: R[]): Fixed<R>[] => weighting(card, 0);
export const highest   = <R extends InputReport>(card: R[]): Fixed<R>[] => weighting(card, 1);

const storageKey             = 'dataflow/reports';
export const reportCardState = atom<ReportCard>({
  key    : 'dataflow-report-card',
  effects: [
    ({ setSelf, onSet }) => {
      const cache = localStorage.getItem(storageKey);
      if (cache == null) setSelf([]);
      else {
        const parsed = JSON.parse(cache);
        setSelf(parsed);
      }
      
      onSet((v, _, isReset) => {
        const sorted = Array.from(v);
        sorted.sort((a, b) => {
          const codeOrd = courseCodeToInt(a.course.code) - courseCodeToInt(b.course.code);
          if (codeOrd != 0) return codeOrd;
          
          const flagA = 'number' !== typeof a.point;
          const flagB = 'number' !== typeof b.point;
          if (flagA && flagB) return 0;
          if (flagA) return 1;
          if (flagB) return -1;
          return -(a.point - b.point);
        });
        setSelf(sorted);
        if (!isReset) localStorage.setItem(storageKey, JSON.stringify(sorted));
      });
    },
  ],
});

