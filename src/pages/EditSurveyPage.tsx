import { FeaturePlaceholder } from '../components/FeaturePlaceholder';
import { usePageTitle } from '../hooks/usePageTitle';

export function EditSurveyPage() {
  usePageTitle('Edit survey');
  return (
    <FeaturePlaceholder
      title="Edit survey"
      description="Adjust questions and choice order in one place. Survey editing will be available when your instructor workspace is ready."
    />
  );
}
