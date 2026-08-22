import { Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import ControlCenter from './pages/ControlCenter';
import Coworkers from './pages/Coworkers';
import CoworkerDetail from './pages/CoworkerDetail';
import Agents from './pages/Agents';
import AgentDetail from './pages/AgentDetail';
import Actions from './pages/Actions';
import ActionDetail from './pages/ActionDetail';
import Policies from './pages/Policies';
import PolicyDetail from './pages/PolicyDetail';
import Systems from './pages/Systems';
import DataAssets from './pages/DataAssets';
import Simulator from './pages/Simulator';
import GraphExplorer from './pages/GraphExplorer';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<ControlCenter />} />
        <Route path="coworkers" element={<Coworkers />} />
        <Route path="coworkers/:id" element={<CoworkerDetail />} />
        <Route path="agents" element={<Agents />} />
        <Route path="agents/:id" element={<AgentDetail />} />
        <Route path="systems" element={<Systems />} />
        <Route path="data-assets" element={<DataAssets />} />
        <Route path="policies" element={<Policies />} />
        <Route path="policies/:id" element={<PolicyDetail />} />
        <Route path="actions" element={<Actions />} />
        <Route path="actions/:id" element={<ActionDetail />} />
        <Route path="simulator" element={<Simulator />} />
        <Route path="graph" element={<GraphExplorer />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
