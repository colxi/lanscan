import { getDevicesOpenPorts } from './port-scan/index';
import { discoverDevices } from './device-discovery';
import { getConfig, initConfig } from './config';
import { displayCommandLineUsage, getCommandLineArgs } from './cli'
import { getDevicesIdentity } from './device-identity'
import { generateIpRange } from './utils/network/ip'
import { mergeObjects } from './utils/object/merge'
import { flattenObject } from './utils/object/flatten';


/**
 * 
 * Main CLI function
 * 
 */
export async function lanScanCLI() {
  const args = getCommandLineArgs();
  initConfig({ mode: 'args', data: args });

  // Show help if requested
  if (args['--help']) {
    displayCommandLineUsage();
    process.exit(0);
  }

  console.log('🔍 Starting');

  // DISCOVER DEVICES
  const { startIp, endIp, ports } = getConfig();
  const ipAddressesCount = generateIpRange(startIp, endIp).length
  console.log(`🔍 Scanning ${ipAddressesCount} ip addresses...`)
  const networkDevicesByIp = await discoverDevices();
  console.log(`⭐️ Found ${Object.keys(networkDevicesByIp).length} devices`);
  console.log(networkDevicesByIp)
  
  // GET DEVICES OPEN PORTS
  const devicesIps = Object.keys(networkDevicesByIp)
  console.log(`🔍 Scanning ${ports.length} ports in ${devicesIps.length} devices...`)
  const openPortsByIp = await getDevicesOpenPorts(devicesIps)
  console.log(`⭐️ Port scan completed`);
  console.log(openPortsByIp);

  // IDENTIFY DEVICES 
  console.log(`🔍 Identifying ${devicesIps.length} devices...`)
  const payload = mergeObjects(networkDevicesByIp, openPortsByIp)
  const deviceIdentityByIp = await getDevicesIdentity(payload)
  console.log(`⭐️ Device identification completed`)
  console.log(deviceIdentityByIp)

  // OUTPUT RESULTS
  console.log(`✅ Done!`)
  const result = mergeObjects(networkDevicesByIp, openPortsByIp, deviceIdentityByIp)
  console.table(Object.entries(result).map(([ip, data]) => ({
    ip,
    ...flattenObject(data)
  })))
}

