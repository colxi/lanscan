import { IpRange } from './../types/index';
import type { NetworkScanResult } from './types';
import { isDeviceAlive } from './helpers/is-device-alive';
import { parallelize } from '../utils/concurrency/parallelize'
import { generateIpRange, ipToNumber } from '../utils/network/ip'
import { getConfig } from '../config'



/**
 * 
 * Scan the network 
 * 
 */
export async function discoverDevices(): Promise<NetworkScanResult> {
  const {
    startIp,
    endIp,
    ports,
    timeout,
    concurrencyLimit,
  } = getConfig();

  const ipAddresses = generateIpRange(startIp, endIp);
  const scanResult = await parallelize(
    ipAddresses,
    concurrencyLimit,
    async (ip) => await isDeviceAlive(ip, ports, timeout)
  );

  const sortedResults = scanResult.sort((a, b) => ipToNumber(a.ip) - ipToNumber(b.ip))
  const normalizedResult: NetworkScanResult = {}

  sortedResults.forEach(i => {
    if(i.isAlive){
      normalizedResult[i.ip] = { detectionMethod: i.detectionMethod! }
    }
  })

  return normalizedResult
}


