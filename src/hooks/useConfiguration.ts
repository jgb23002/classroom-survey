import { useContext } from 'react';
import { ConfigurationContext } from '../contexts/ConfigurationContext';

export function useConfiguration() {
  const configuration = useContext(ConfigurationContext);
  if (!configuration) {
    throw new Error('useConfiguration must be used within ConfigurationProvider.');
  }
  return configuration;
}
