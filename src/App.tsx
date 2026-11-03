import { Route, Routes } from 'react-router';
import { InstructorLayout } from './components/layouts/InstructorLayout';
import { SiteLayout } from './components/layouts/SiteLayout';
import { StudentLayout } from './components/layouts/StudentLayout';
import { RouteAccessibility } from './components/RouteAccessibility';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { NewSurveyPage } from './pages/NewSurveyPage';
import { EditSurveyPage } from './pages/EditSurveyPage';
import { PresentSurveyPage } from './pages/PresentSurveyPage';
import { ResultsPage } from './pages/ResultsPage';
import { StudentSurveyPage } from './pages/StudentSurveyPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { RequireInstructor } from './components/RequireInstructor';

export function App() {
  return (
    <>
      <RouteAccessibility />
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route element={<RequireInstructor />}>
          <Route element={<InstructorLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/surveys/new" element={<NewSurveyPage />} />
            <Route path="/surveys/:id/edit" element={<EditSurveyPage />} />
            <Route path="/surveys/:id/present" element={<PresentSurveyPage />} />
            <Route path="/surveys/:id/results" element={<ResultsPage />} />
          </Route>
        </Route>
        <Route element={<StudentLayout />}>
          <Route path="/s/:slug" element={<StudentSurveyPage />} />
        </Route>
      </Routes>
    </>
  );
}
