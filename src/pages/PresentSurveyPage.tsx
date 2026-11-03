import { FeaturePlaceholder } from '../components/FeaturePlaceholder';
import { usePageTitle } from '../hooks/usePageTitle';

export function PresentSurveyPage() {
  usePageTitle('Present survey');
  return (
    <FeaturePlaceholder
      title="Present survey"
      description="Your survey’s QR code, shareable link, and response count will appear here after survey activation is connected."
    />
  );
}
