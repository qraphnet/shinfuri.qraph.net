import { type FC, type ReactNode, useMemo } from 'react';
import { CourseCode, Scope }                from 'shinfuri/lib/course-code.js';

import { CourseTree, CourseTreeNode, depth } from '../dataflow/course-tree.js';

type Allocation<T> = Omit<CourseTreeNode, 'sub'> & AllocationTree<T>;
type AllocationTree<T> = { count: number; empty: number; allocated: T[]; sub: Allocation<T>[]; };
const allocate = <T, >(tree: CourseTree, values: T[], mapper: (v: T) => CourseCode | Scope, counter: (v: T) => number): AllocationTree<T> => {
  const count = values.map(counter).reduce((a, c) => a + c, 0);
  
  const map   = new Map<CourseTreeNode, T[]>;
  const flags = values.map(() => false);
  for (const node of tree) {
    const vs: T[] = [];
    for (const [i, v] of values.entries()) {
      const codeOrScope = mapper(v);
      if (!flags[i] && ('string' === typeof codeOrScope ? node.scope.match(codeOrScope) : node.scope.includes(codeOrScope))) {
        vs.push(v);
        flags[i] = true;
      }
    }
    map.set(node, vs);
  }
  const rest = values.filter((_, i) => !flags[i]);
  const sub  = Array.from(map).map(([node, values]) => ({
    ...node, ...(node.sub == null ? {
      count    : values.map(counter).reduce((a, c) => a + c, 0),
      empty    : values.length === 0 ? 1 : 0,
      allocated: values,
      sub      : [],
    } : allocate(node.sub, values, mapper, counter)),
  }));
  return { count, empty: sub.reduce((a, c) => a + c.empty, 0), allocated: rest, sub };
};

type ThProps =
  & { colSpan?: number; rowSpan?: number; }
  & ({ name: string; scope: Scope } | { name?: undefined; scope?: undefined })
  ;
type Th = FC<ThProps>;
type Row<T> = FC<{ value?: T, children: ReactNode }>;
type RowsProps<T, > = {
  values: T[];
  mapper: (v: T) => CourseCode | Scope;
  rowCounter: (v: T) => number;
  tree: CourseTree;
  row: Row<T>;
  th: Th;
};
export const Rows = <T, >(props: RowsProps<T>) => {
  const { values, mapper, rowCounter, tree, row: Row, th: Th } = props;
  
  const allocationTree = useMemo(() => allocate(tree, values, mapper, rowCounter), [tree, values, mapper, rowCounter]);
  const sideWidth      = depth(allocationTree.sub);
  
  return Array.from(rowDataGenerator(allocationTree)).map(({ ths, value }, i) =>
    <Row key={ ths.map(v => v.name ?? '').join('/') + '/' + i } value={ value }>
      { ths.map((th, i) => th.i == 0 && <Th key={ i } colSpan={ i == ths.length - 1 ? sideWidth - i : 1 } { ...th }/>) }
    </Row>,
  );
};

type ThData = { name: string; scope: Scope; rowSpan: number; i: number } | {
  name?: undefined;
  scope?: undefined;
  rowSpan: number;
  i: number
};
type RowData<T> = { ths: ThData[]; value: T | undefined };
const rowDataGenerator = function* <T>({ sub, allocated, count }: AllocationTree<T>): Generator<RowData<T>> {
  for (const alloc of sub) {
    let i = 0;
    
    const { name, scope, count, empty } = alloc;
    for (const { ths, value } of rowDataGenerator(alloc)) {
      yield {
        ths: [{ name, scope, rowSpan: count + empty, i }, ...ths],
        value,
      };
      i += 1;
    }
  }
  
  for (const [i, value] of allocated.entries()) {
    yield {
      ths: sub.length == 0 ? [] : [{ rowSpan: sub.reduce((a, c) => a - c.count, count), i }],
      value,
    };
  }
  if (sub.length + allocated.length == 0) yield { ths: [], value: void 0 };
};
