import { ParsedCommandLineArgs } from '../../cli/types'

/**
 * Configuration for the network scan
 */
export type ScanConfig = Readonly<{
  startIp: string;
  endIp: string;
  ports: number[];
  timeout: number;
  concurrencyLimit: number;
  identifyDevices: boolean; // Attempt to identify devices (hostname, services)
  verbose: boolean; // Show verbose identification details
}>

export type InitConfigOptions = { 
  mode: 'args', 
  data: ParsedCommandLineArgs 
} | { 
  mode: 'object', 
  data: Partial<ScanConfig>
}