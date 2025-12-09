import { CommonPorts } from '../constants'
import { ScanConfig } from './types'

/**
 * 
 * Default configuration values
 * 
 */
export const defaultConfig: ScanConfig = {
  timeout: 2000,
  concurrencyLimit: 50,
  identifyDevices: true,
  verbose: false,
  startIp: '192.168.1.1',
  endIp: '192.168.1.254',
  ports: CommonPorts.Common,
};
