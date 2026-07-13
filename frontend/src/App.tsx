import { Route, Routes } from "react-router-dom";
import { BuildDetailPage, ReleaseItemDetailPage, ReleaseItemListPage } from "./pages";

export function App() {
  return (
    <div className="page">
      <Routes>
        <Route path="/" element={<ReleaseItemListPage />} />
        <Route path="/release-items/:workItemId" element={<ReleaseItemDetailPage />} />
        <Route path="/release-items/:workItemId/builds/:buildId" element={<BuildDetailPage />} />
      </Routes>
    </div>
  );
}
