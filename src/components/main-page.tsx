import {FC} from "react";

import {Profile} from "../dataflow/profile/index.js";

import {Reports} from "./reports-viewer.js";
import {ProfileHeader} from "./profile-header.js";
import {ReportDialog} from "./report-dialog.js";
import {AvgList} from "./avg-list.js";
import {Calculation} from "./calculation.js";
import {atom, useRecoilState} from "recoil";

type Pane = 'reports' | 'avg-list' | 'calculation';
const paneState = atom<Pane>({
  key: 'components/main-page/pane',
  default: 'reports',
})

export const Main: FC<{ profile: Profile}> = () => {
  const [pane, setPane] = useRecoilState(paneState)
  return <div>
    <ProfileHeader/>
    <div className="pane-select">
      <label><input type="radio" value="reports" checked={pane === "reports"} onChange={e => setPane(e.target.value as Pane)} />成績表</label>
      <label><input type="radio" value="avg-list" checked={pane === "avg-list"} onChange={e => setPane(e.target.value as Pane)} />平均点一覧</label>
      <label><input type="radio" value="calculation" checked={pane === "calculation"} onChange={e => setPane(e.target.value as Pane)} />平均点計算</label>
    </div>
    { pane === 'reports' ? <Reports /> : pane === "avg-list" ? <AvgList /> : <Calculation/> }
    <ReportDialog />
  </div>;
};
