import { defaultConfig } from './config.default'
import { assertIsValidConfig, getConfigFromArgs, getConfigFromObject } from './helpers'
import { InitConfigOptions, ScanConfig } from './types'

/**
 * 
 * Configuration object (Private)
 * 
 */
let config: ScanConfig | null = null;


/**
 * 
 * Initialize the application configuration
 * 
 */
export const initConfig = (options: InitConfigOptions): void => {
  let newConfig = options.mode === 'args' 
    ? getConfigFromArgs(options.data, defaultConfig) 
    : getConfigFromObject(options.data, defaultConfig);
    
  assertIsValidConfig(newConfig);
  config = newConfig;
};


/**
 * 
 * Returns the configuration object
 * 
 */
export const getConfig = (): ScanConfig => {
  if (!config) {
    throw new Error('Configuration not initialized');
  }
  return config;
};


