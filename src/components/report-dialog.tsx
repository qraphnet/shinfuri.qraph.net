import {FC, useEffect, useRef} from "react";
import {selector, useRecoilCallback, useRecoilValue} from "recoil";

import {formProps, validatedReport} from "../dataflow/reports/form.js";
import {reportCardState} from "../dataflow/reports/index.js";
import {ReportForm} from "./report-form.js";

import "./report-dialog.css";

const openState = selector({
  key: 'components/report-dialog-open',
  get: ({ get }) => get(formProps) != null,
})

export const ReportDialog: FC = () => {
  const ref = useRef<HTMLDialogElement>(null);
  const rref = useRecoilCallback(({ set }) => {
    let cleanup: () => void;
    return (node: HTMLDialogElement | null) => {
      if (node == null) {
        cleanup?.();
        return;
      }

      const controller = new AbortController;

      node.addEventListener('close', () => {
        set(formProps, void 0);
      }, { signal: controller.signal });

      (ref as any).current = node;

      cleanup = () => {
        controller.abort();
      }
    };
  }, []);

  const open = useRecoilValue(openState);

  useEffect(() => {
    if (open) ref.current?.showModal();
  }, [open])

  const submitHandler = useRecoilCallback(
    ({ snapshot, set }) => 
      () => {
        Promise.all([snapshot.getPromise(validatedReport), snapshot.getPromise(formProps)]).then(([report, props]) => {
          const defaultReport = props?.defaultReport;
          if (report != null) set(reportCardState, current => current.filter(r => r !== defaultReport).concat([report]));
          ref.current?.close();
        });
      },
    []
  );

  const remove = useRecoilCallback(({ snapshot, set }) => () => {
    snapshot.getPromise(formProps).then(props => {
      const defaultReport = props?.defaultReport;
      set(reportCardState, current => current.filter(r => r !== defaultReport));
      ref.current?.close();
    });
  });

  return <dialog ref={rref} className="report-dialog">
    { open && <ReportForm method="dialog" onSubmit={submitHandler}/> }
    <div>
      <button onClick={() => ref.current?.close()}>cancel</button>
      <button onClick={remove}>delete</button>
    </div>
  </dialog>;
}
