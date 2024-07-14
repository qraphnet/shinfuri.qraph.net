import { SpecificReport } from 'shinfuri/lib/report.js';
const parser = new DOMParser;

type CourseRow = { title: string; lecturer: string; year: string; term: string; credit: string; score: string; };
const mapping = { 科目: 'title', 教員: 'lecturer', 年度: 'year', 学期: 'term', 単位: 'credit', 評点: 'score' } satisfies Record<string, keyof CourseRow>;
export const parse = (html: string): SpecificReport[] | 'error' => {
  const dom = parser.parseFromString(html, 'text/html');
  const table = dom.querySelector('table.normal');
  if (table == null) return 'error';
  const rows = Array.from(table.querySelectorAll('tr'));

  const header = rows[0];
  const keyIndex: (undefined | keyof CourseRow)[] = Array.from(header.querySelectorAll('td')).map(td => mapping[td.textContent as keyof typeof mapping]);
  if (keyIndex.includes(void 0)) return 'error';
  
  const classi: string[] = [];
  let i = 1;
  while (i < rows.length) {
    const row = rows[i];
    const course = Object.fromEntries(Array.from(row.querySelectorAll('td')).map((td, i) => [keyIndex[i], td.textContent ?? ""])) as CourseRow;
    const match = course.title.match(/^(\s*)(\S+)$/);
    if (match == null) return 'error';
    const [, spacing, title] = match;
    classi.splice(spacing.length, Infinity, title);
  }


  return [];
};
