import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { AnalysisPage } from "./pages/AnalysisPage";
import { ApplicationsPage } from "./pages/ApplicationsPage";
import { AssistantPage } from "./pages/AssistantPage";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import { DashboardPage } from "./pages/DashboardPage";
import { HistoryPage } from "./pages/HistoryPage";
import { JobsPage } from "./pages/JobsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ResumeLibraryPage } from "./pages/ResumeLibraryPage";
import { ResumeUploadPage } from "./pages/ResumeUploadPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="resumes/upload" element={<ResumeUploadPage />} />
          <Route path="resumes" element={<ResumeLibraryPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="analysis/:id" element={<AnalysisPage />} />
          <Route path="assistant" element={<AssistantPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<p className="text-slate-500">Page not found.</p>} />
        </Route>
      </Route>
    </Routes>
  );
}
