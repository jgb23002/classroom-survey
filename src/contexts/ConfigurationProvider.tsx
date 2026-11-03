import { useState, type ReactNode } from 'react';
import { ConfigurationContext } from './ConfigurationContext';
import type { ConfigurationState } from '../types/configuration';
import { ConfigurationError, readSupabaseConfiguration } from '../utilities/env';

function loadConfiguration(): ConfigurationState {
  try {
    return {
      status: 'ready',
      configuration: readSupabaseConfiguration(import.meta.env),
    };
  } catch (error) {
    if (!(error instanceof ConfigurationError)) throw error;
    return { status: 'unavailable', message: error.message };
  }
}

export function ConfigurationProvider({ children }: { children: ReactNode }) {
  const [configuration] = useState(loadConfiguration);
  return (
    <ConfigurationContext.Provider value={configuration}>{children}</ConfigurationContext.Provider>
  );
}
