import { FeaturePlaceholder } from '../components/FeaturePlaceholder';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../hooks/useAuth';

export function DashboardPage() {
  usePageTitle('Dashboard');
  const auth = useAuth();
  return (
    <>
      <p className="mb-5 text-sm text-muted">Signed in as {auth.user?.email}</p>
      <FeaturePlaceholder
        title="Dashboard"
        description="Survey lists, search, and status filters will appear here once survey management is connected."
      />
    </>
  );
}
