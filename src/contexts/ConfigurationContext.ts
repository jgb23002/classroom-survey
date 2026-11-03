import { createContext } from 'react';
import type { ConfigurationState } from '../types/configuration';

export const ConfigurationContext = createContext<ConfigurationState | undefined>(undefined);
