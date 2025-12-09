import { deviceHasOpenPorts } from '../../utils/network/device/device-has-open-ports'
import { isDeviceInArpTable } from '../../utils/network/device/is-device-in-arp-table'
import { pingDevice } from '../../utils/network/device/ping-device'
import { sleep } from '../../utils/sleep'


export type DeviceScanResult = {
  ip: string
  isAlive: boolean,
  detectionMethod: 'ping' | 'arp' | 'port-scan' | null
}

/**
 * 
 * Scan all specified ports on a single host
 * 
 */
export async function isDeviceAlive(
  ip: string, 
  ports: number[], 
  timeout: number
): Promise<DeviceScanResult> {
   // METHOD 1
   // ---------------------------------------------------------------------------------
   // Try ICMP ping
  const pingTimeout = Math.min(timeout, 1000); // Use shorter timeout for ping
  const pingResponded = await pingDevice(ip, pingTimeout);
  if( pingResponded ) {
    return {ip, isAlive: true, detectionMethod: 'ping'}
  }

  // METHOD 2
  // ---------------------------------------------------------------------------------
  // Check ARP table
  // Trick: Because even when ping is blocked, the MAC of the pingued device is added
  // to the ARP table. Thanks to this we can see if there is a device behind that ip
  await sleep(100) // leave som time to allow ip address to be added to arp table
  const isInArpTable = await isDeviceInArpTable(ip) 
  if(isInArpTable) {
    return {ip, isAlive: true, detectionMethod: 'arp'}
  }

  // METHOD 3
  // ---------------------------------------------------------------------------------
  // Try to find an open port
  const hasOpenPort = await deviceHasOpenPorts(ip, ports, timeout)
  if (hasOpenPort) {
    return {ip, isAlive: true, detectionMethod: 'port-scan' };
  }
  
  // DEVICE IS NOT ALIVE!
  // ---------------------------------------------------------------------------------
  return {ip, isAlive: false, detectionMethod: null }
}
  

