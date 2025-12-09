import { getConfig } from '../config'
import { createArrayFromObjectKey } from '../utils/array'
import { parallelize } from '../utils/concurrency/parallelize'
import { getPortStatus } from '../utils/network/port/get-port-status'
import { PortScanResults } from './types'

export const getDevicesOpenPorts = async (
  ips: string[]
): Promise<PortScanResults> => {
  const { ports, timeout } = getConfig();
  
  const results: PortScanResults = {}
  for(const ip of ips){
    const openPorts = await scanDevicePorts(ip, ports, timeout)
    results[ip] = { openPorts }
  }

  return results;
};


const scanDevicePorts = async (
  ip: string,
  ports: number[],
  timeout: number
): Promise<number[]> => {
  const MAX_CONCURRENT_PORTS = 5;

  const results = await parallelize(ports, MAX_CONCURRENT_PORTS, async (port)=>{
    return {
      port: port, 
      status: await getPortStatus(ip,port,timeout)
    }
  })


  const filteredResults = results.filter(port=> port.status === 'open')
  return createArrayFromObjectKey(filteredResults, 'port')
};
