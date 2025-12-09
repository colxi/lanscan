import { PortByServiceName } from '../constants'

/**
 * Parsed IP range result
 */
export interface IpRange {
  startIp: string;
  endIp: string;
}


export type PortName = keyof typeof PortByServiceName;