import { ParsedCommandLineArgs } from '../../cli/types'
import { CommonPorts } from '../../constants'
import { ipToNumber, isValidIpAddress, parseIpRange } from '../../utils/network/ip'
import { ScanConfig } from '../types'

export function getConfigFromObject(
    config: Partial<ScanConfig>,
    defaultConfig: ScanConfig
): ScanConfig {
    return { ...defaultConfig, ...config };
}

export function getConfigFromArgs(
    args: ParsedCommandLineArgs, 
    defaultConfig: ScanConfig
): ScanConfig {
    // Parse IP range
    const rangeArg = args['--ip'] || `${defaultConfig.startIp}-${defaultConfig.endIp}`;
    let startIp: string;
    let endIp: string;
    try {
    const range = parseIpRange(rangeArg);
    startIp = range.startIp;
    endIp = range.endIp;
    } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Invalid IP range');
    process.exit(1);
    }

    // Parse ports - can be either comma-separated numbers or a CommonPorts key
    const portsArg = args['--ports'] || defaultConfig.ports.join(',');
    let ports: number[];
    if (portsArg in CommonPorts) {
    const key = portsArg as keyof typeof CommonPorts;
    ports = CommonPorts[key];
    } else {
    ports = portsArg.split(',').map((p) => parseInt(p.trim(), 10));
    }

    // Build configuration with defaults and overrides
    const config = {
      startIp,
      endIp,
      ports,
      timeout: args['--timeout'] ?? defaultConfig.timeout,
      concurrencyLimit: args['--concurrency'] ?? defaultConfig.concurrencyLimit,
      identifyDevices: args['--identify'] ?? defaultConfig.identifyDevices,
      verbose: args['--verbose'] ?? defaultConfig.verbose,
    };
    
    return config;
}

/**
 * 
 * Method to assert that the configuration is valid
 * 
 */
export function assertIsValidConfig(newConfig: unknown): asserts newConfig is ScanConfig {
  if (typeof newConfig !== 'object' || newConfig === null) {
    throw new Error('Configuration must be an object');
  }

  // Validate startIp
  if (!('startIp' in newConfig) || typeof newConfig.startIp !== 'string') {
    throw new Error('startIp must be a string');
  }
  if (!isValidIpAddress(newConfig.startIp)) {
    throw new Error(`Invalid startIp: ${newConfig.startIp}`);
  }

  // Validate endIp
  if (!('endIp' in newConfig) || typeof newConfig.endIp !== 'string') {
    throw new Error('endIp must be a string');
  }
  if (!isValidIpAddress(newConfig.endIp)) {
    throw new Error(`Invalid endIp: ${newConfig.endIp}`);
  }

  // Validate IP range order
  const startNum = ipToNumber(newConfig.startIp);
  const endNum = ipToNumber(newConfig.endIp);
  if (startNum > endNum) {
    throw new Error('startIp must be less than or equal to endIp');
  }

  // Validate ports
  if (!('ports' in newConfig) || !Array.isArray(newConfig.ports) || newConfig.ports.length === 0) {
    throw new Error('At least one port must be specified');
  }
  if (newConfig.ports.some((p) => typeof p !== 'number' || isNaN(p) || p < 1 || p > 65535)) {
    throw new Error('Invalid port number(s). Ports must be between 1 and 65535');
  }

  // Validate timeout
  if (!('timeout' in newConfig) || typeof newConfig.timeout !== 'number' || newConfig.timeout <= 0 || isNaN(newConfig.timeout)) {
    throw new Error('Timeout must be a positive number');
  }

  // Validate concurrency
  if (!('concurrencyLimit' in newConfig) || typeof newConfig.concurrencyLimit !== 'number' || newConfig.concurrencyLimit <= 0 || isNaN(newConfig.concurrencyLimit)) {
    throw new Error('Concurrency must be a positive number');
  }

  // Validate identify
  if (!('identifyDevices' in newConfig) || typeof newConfig.identifyDevices !== 'boolean') {
    throw new Error('Identify must be a boolean');
  }

  // Validate verbose
  if (!('verbose' in newConfig) || typeof newConfig.verbose !== 'boolean') {
    throw new Error('Verbose must be a boolean');
  }
}
