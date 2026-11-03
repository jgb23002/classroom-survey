import { Navigate, useParams } from 'react-router';
import { SurveyEditor } from '../components/SurveyEditor';
import { usePageTitle } from '../hooks/usePageTitle';

export function EditSurveyPage() {
  usePageTitle('Edit survey');
  const { id } = useParams();
  if (!id) return <Navigate to="/dashboard" replace />;
  return <SurveyEditor initialSurveyId={id} />;
}
