import { FeaturePlaceholder } from '../components/FeaturePlaceholder';
import { usePageTitle } from '../hooks/usePageTitle';

export function NewSurveyPage() {
  usePageTitle('New survey');
  return (
    <FeaturePlaceholder
      title="New survey"
      description="The survey editor will let you prepare multiple-choice and true-or-false questions. Creating and saving surveys is not available yet."
    />
  );
}
