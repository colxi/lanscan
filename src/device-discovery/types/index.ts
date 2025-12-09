import { DeviceScanResult } from '../helpers/is-device-alive'

export type NetworkScanResultEntry = { 
  detectionMethod: Exclude<DeviceScanResult['detectionMethod'], null> 
}

export type NetworkScanResult = Record<string, NetworkScanResultEntry>
