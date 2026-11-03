import { FeaturePlaceholder } from '../components/FeaturePlaceholder';
import { usePageTitle } from '../hooks/usePageTitle';

export function ResultsPage() {
  usePageTitle('Survey results');
  return (
    <FeaturePlaceholder
      title="Survey results"
      description="Review your class responses, explore charts, and export results when your instructor workspace is ready."
    />
  );
}
