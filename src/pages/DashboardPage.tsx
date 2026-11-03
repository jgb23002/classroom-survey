import { FeaturePlaceholder } from '../components/FeaturePlaceholder';
import { usePageTitle } from '../hooks/usePageTitle';

export function DashboardPage() {
  usePageTitle('Dashboard');
  return (
    <FeaturePlaceholder
      title="Dashboard"
      description="Survey lists, search, and status filters will appear here once instructor access and survey management are connected."
    />
  );
}
