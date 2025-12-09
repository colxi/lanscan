import { getDevicesOpenPorts } from './port-scan/index';
import { discoverDevices } from './device-discovery';
import { getDevicesIdentity } from './device-identity'
import { mergeObjects } from './utils/object/merge'
import { ScanConfig } from './config/types'
import { initConfig } from './config'


/**
 * 
 * Method to scan the LAN network and return the results
 * 
 * @param config - The configuration for the scan
 * @returns The results of the scan
 * 
 */
export async function lanScanProgrammatic(config: ScanConfig) {
  initConfig({ mode: 'object', data: config });
  
  const networkDevicesByIp = await discoverDevices();
  const devicesIps = Object.keys(networkDevicesByIp)
  const openPortsByIp = await getDevicesOpenPorts(devicesIps)
  const payload = mergeObjects(networkDevicesByIp, openPortsByIp)
  const deviceIdentityByIp = await getDevicesIdentity(payload)
  const result = mergeObjects(networkDevicesByIp, openPortsByIp, deviceIdentityByIp)
  
  return result
}
