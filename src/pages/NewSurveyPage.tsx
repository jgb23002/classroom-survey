import { SurveyEditor } from '../components/SurveyEditor';
import { usePageTitle } from '../hooks/usePageTitle';

export function NewSurveyPage() {
  usePageTitle('New survey');
  return <SurveyEditor />;
}
