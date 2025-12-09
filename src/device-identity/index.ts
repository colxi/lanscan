import { callAsyncMethodWithTimeout } from '../utils/promise'
import { getEnhancedHttpInfo, getHostname, getMacAddress, getMdnsName, getNetBiosName, getSmbHostname, getSnmpInfo, getUpnpInfo, getVendorFromMac, grabBanner, identifyService } from './helpers'
import { DeviceIdentity, DeviceIdentityResult } from './types'

const IDENTIFY_TIMEOUT= 15000


export const getDevicesIdentity = async  (
  devices: Record<string, {openPorts:number[]}>,
)=>{
  const results: DeviceIdentityResult= {}

  for (const deviceIp of Object.keys(devices)) {
    const identity = await callAsyncMethodWithTimeout(
      () => identifyDevice(deviceIp, devices[deviceIp].openPorts),
      IDENTIFY_TIMEOUT,
      null,
      { retry: 1, delay: 100 }
    )
    results[deviceIp] = { identity : identity ?? {} }
  }
  
  return results  
}

/**
 * 
 * Perform device identification
 * 
 */
export async function identifyDevice(
  ip: string,
  openPorts: number[],
): Promise<DeviceIdentity> {
  const deviceInfo: DeviceIdentity = {};

  try {
    // Try multiple methods to get hostname/device name in parallel
    // Wrap each promise to catch individual failures
    const identificationPromises = [
      getHostname(ip).catch(() => undefined),
      getMacAddress(ip).catch(() => undefined),
      getNetBiosName(ip).catch(() => undefined),
      getMdnsName(ip).catch(() => undefined),
      openPorts.includes(161) ? getSnmpInfo(ip).catch(() => undefined) : Promise.resolve(undefined),
      openPorts.includes(445) ? getSmbHostname(ip).catch(() => undefined) : Promise.resolve(undefined),
      getUpnpInfo(ip).catch(() => undefined),
    ];

    const [hostname, macAddress, netbiosName, mdnsName, snmpInfo, smbHostname, upnpInfo] = 
      await Promise.all(identificationPromises) as [
        string | undefined,
        string | undefined,
        string | undefined,
        string | undefined,
        { hostname?: string; description?: string } | undefined,
        string | undefined,
        { hostname?: string; deviceType?: string } | undefined
      ];

    // Get MAC address and vendor
    let vendor: string | undefined;
    if (macAddress) {
      vendor = await getVendorFromMac(macAddress).catch(() => undefined);
    }

    // Determine best hostname to use (in order of preference)
    if (hostname && hostname !== ip) {
      deviceInfo.hostname = hostname;
      deviceInfo.identificationMethod = 'DNS';
    } else if (snmpInfo?.hostname) {
      deviceInfo.hostname = snmpInfo.hostname;
      deviceInfo.identificationMethod = 'SNMP';
    } else if (smbHostname) {
      deviceInfo.hostname = smbHostname;
      deviceInfo.identificationMethod = 'SMB';
    } else if (netbiosName) {
      deviceInfo.hostname = netbiosName;
      deviceInfo.identificationMethod = 'NetBIOS';
    } else if (mdnsName) {
      deviceInfo.hostname = mdnsName;
      deviceInfo.identificationMethod = 'mDNS';
    } else if (vendor) {
      // If we can't find a hostname, at least show the vendor
      deviceInfo.hostname = vendor;
      deviceInfo.identificationMethod = 'MAC Vendor';
    }

    // Use SNMP description or UPnP info for additional context
    let osHint: string | undefined;
    if (snmpInfo?.description) {
      const desc = snmpInfo.description.toLowerCase();
      if (desc.includes('linux')) osHint = 'Linux';
      else if (desc.includes('windows')) osHint = 'Windows';
      else if (desc.includes('darwin') || desc.includes('mac os')) osHint = 'macOS';
      else if (desc.includes('freebsd')) osHint = 'FreeBSD';
      else if (desc.includes('cisco')) osHint = 'Cisco';
      else if (desc.includes('mikrotik')) osHint = 'MikroTik';
    }

    // Try to guess device type from hostname, vendor, or other info
    const nameToCheck = (deviceInfo.hostname || vendor || upnpInfo?.deviceType || '').toLowerCase();
    
    if (vendor === 'Apple' || nameToCheck.includes('iphone') || nameToCheck.includes('ipad') || 
        nameToCheck.includes('macbook') || nameToCheck.includes('imac') || osHint === 'macOS') {
      deviceInfo.deviceType = vendor === 'Apple' ? 'Apple Device' : 'Apple';
    } else if (vendor === 'Raspberry Pi') {
      deviceInfo.deviceType = 'Raspberry Pi';
    } else if (vendor === 'Samsung' || nameToCheck.includes('samsung')) {
      deviceInfo.deviceType = 'Samsung Device';
    } else if (vendor === 'Google' || vendor === 'Google Chromecast' || vendor === 'Google Nest') {
      deviceInfo.deviceType = vendor;
    } else if (vendor === 'Amazon Echo' || vendor === 'Amazon Ring' || vendor === 'Amazon') {
      deviceInfo.deviceType = vendor;
    } else if (vendor === 'Philips Hue') {
      deviceInfo.deviceType = 'Philips Hue';
    } else if (vendor === 'Sonos') {
      deviceInfo.deviceType = 'Sonos Speaker';
    } else if (vendor === 'Synology' || vendor === 'QNAP' || nameToCheck.includes('nas')) {
      deviceInfo.deviceType = vendor || 'NAS';
    } else if (vendor === 'TP-Link' || vendor === 'Ubiquiti' || vendor === 'Netgear' || 
               vendor === 'Asus' || vendor === 'Cisco' || nameToCheck.includes('router') || 
               nameToCheck.includes('gateway') || osHint === 'Cisco' || osHint === 'MikroTik') {
      deviceInfo.deviceType = vendor ? `${vendor} Router` : (osHint || 'Router/Gateway');
    } else if (vendor === 'HP' || nameToCheck.includes('printer') || nameToCheck.includes('epson')) {
      deviceInfo.deviceType = vendor ? `${vendor} Printer` : 'Printer';
    } else if (vendor === 'Xiaomi') {
      deviceInfo.deviceType = 'Xiaomi Device';
    } else if (nameToCheck.includes('android')) {
      deviceInfo.deviceType = 'Android Device';
    } else if (nameToCheck.includes('iot') || nameToCheck.includes('smart') || upnpInfo?.deviceType) {
      deviceInfo.deviceType = upnpInfo?.deviceType || 'IoT Device';
    } else if (osHint === 'Linux') {
      deviceInfo.deviceType = vendor ? `${vendor} (Linux)` : 'Linux Server';
    } else if (osHint === 'Windows') {
      deviceInfo.deviceType = 'Windows Computer';
    } else if (osHint === 'FreeBSD') {
      deviceInfo.deviceType = 'FreeBSD Server';
    } else if (vendor) {
      deviceInfo.deviceType = vendor;
    }

    // Check for HTTP/HTTPS services with enhanced detection
    const httpPorts = [80, 8080, 8000, 8888, 8123];
    
    for (const port of openPorts) {
      if (httpPorts.includes(port)) {
        // Use shorter timeout for HTTP detection to avoid hanging
        // Wrap in Promise.race to ensure it doesn't hang
        const httpPromise = getEnhancedHttpInfo(ip, port, 2000).catch(() => undefined);
        const timeoutPromise = new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 2500));
        const httpInfo = await Promise.race([httpPromise, timeoutPromise]);
        
        if (httpInfo) {
          if (httpInfo.server) {
            deviceInfo.httpServer = httpInfo.server;
          }
          // Use HTTP hostname if we don't have one yet
          if (!deviceInfo.hostname && httpInfo.hostname) {
            deviceInfo.hostname = httpInfo.hostname;
            if (!deviceInfo.identificationMethod) {
              deviceInfo.identificationMethod = 'HTTP';
            }
          }
          // Use page title to enhance device type detection
          if (httpInfo.title && !deviceInfo.deviceType) {
            const title = httpInfo.title.toLowerCase();
            if (title.includes('home assistant')) {
              deviceInfo.deviceType = 'Home Assistant';
              if (!deviceInfo.identificationMethod) deviceInfo.identificationMethod = 'HTTP';
            } else if (title.includes('openwrt')) {
              deviceInfo.deviceType = 'OpenWrt Router';
              if (!deviceInfo.identificationMethod) deviceInfo.identificationMethod = 'HTTP';
            } else if (title.includes('pfsense')) {
              deviceInfo.deviceType = 'pfSense Firewall';
              if (!deviceInfo.identificationMethod) deviceInfo.identificationMethod = 'HTTP';
            } else if (title.includes('synology')) {
              deviceInfo.deviceType = 'Synology NAS';
              if (!deviceInfo.identificationMethod) deviceInfo.identificationMethod = 'HTTP';
            } else if (title.includes('qnap')) {
              deviceInfo.deviceType = 'QNAP NAS';
              if (!deviceInfo.identificationMethod) deviceInfo.identificationMethod = 'HTTP';
            } else if (title.includes('unifi')) {
              deviceInfo.deviceType = 'Ubiquiti UniFi';
              if (!deviceInfo.identificationMethod) deviceInfo.identificationMethod = 'HTTP';
            }
          }
        }
      }
    }

    // Grab banners from interesting ports (including SSH for OS detection)
    deviceInfo.services = {};
    const bannersToGrab = openPorts.filter(p => [21, 22, 23, 25, 110, 143, 3306, 5432, 6379].includes(p));
    
    for (const port of bannersToGrab.slice(0, 5)) { // Increased to 5 ports
      const banner = await grabBanner(ip, port, 1500).catch(() => undefined);
      const service = identifyService(port, banner);
      if (service) {
        deviceInfo.services[port] = service;
        
        // Try to enhance device type from SSH banner
        if (port === 22 && banner && !osHint) {
          const bannerLower = banner.toLowerCase();
          if (bannerLower.includes('ubuntu')) {
            deviceInfo.deviceType = deviceInfo.deviceType || 'Ubuntu Server';
          } else if (bannerLower.includes('debian')) {
            deviceInfo.deviceType = deviceInfo.deviceType || 'Debian Server';
          } else if (bannerLower.includes('raspbian')) {
            deviceInfo.deviceType = 'Raspberry Pi';
          }
        }
      }
    }

    // Add basic service names for common ports without banners
    for (const port of openPorts) {
      if (!deviceInfo.services?.[port]) {
        const basicService = identifyService(port);
        if (basicService) {
          if (!deviceInfo.services) deviceInfo.services = {};
          deviceInfo.services[port] = basicService;
        }
      }
    }
  } catch (error) {
    // If any error occurs during identification, return what we have so far
    // Silently fail to avoid cluttering output
  }

  return {
    hostname:deviceInfo.hostname ?? 'UNKNOWN',
    deviceType:deviceInfo.deviceType ?? 'UNKNOWN',
    identificationMethod:deviceInfo.identificationMethod ?? 'NONE',
  };
}

