import * as dns from 'dns';
import * as net from 'net';
import * as http from 'http';
import * as dgram from 'dgram';
import { PortByServiceName, MacOUIByVendor } from '../../constants'
import { PortName } from '../../types'
import { execAsync } from '../../utils/exec/exec-async'
import { sleep } from '../../utils/sleep'


// Build reverse lookup map: OUI -> Vendor name
const VendorByMacOUI: Record<string, string> = Object.entries(MacOUIByVendor).reduce(
  (acc, [vendor, ouis]) => {
    ouis.forEach((oui) => {
      acc[oui] = vendor;
    });
    return acc;
  },
  {} as Record<string, string>
);  

/**
 * Get MAC address for an IP (works on most systems)
 */
export async function getMacAddress(ip: string): Promise<string | undefined> {
  try {
    // First, try to ping the device to ensure it's in the ARP cache
    // This is important because port scanning might not populate the ARP table
    const isWindows = process.platform === 'win32';
    const pingCmd = isWindows ? `ping -n 1 -w 500 ${ip}` : `ping -c 1 -W 1 ${ip}`;
    
    try {
      await execAsync(pingCmd, { timeout: 1500 });
    } catch {
      // Ping failed, but device might still be in ARP cache from port scan
    }
    
    // Small delay to let ARP cache update
    await sleep(100)

    // Use arp command which works on macOS, Linux, and Windows
    const { stdout } = await execAsync(`arp -n ${ip} 2>/dev/null || arp -a ${ip} 2>/dev/null`, { timeout: 3000 });
    
    // Extract MAC address from output
    // Matches formats like: aa:bb:cc:dd:ee:ff, AA-BB-CC-DD-EE-FF, aabbccddeeff
    const macMatch = stdout.match(/([0-9a-f]{1,2}[:-]){5}[0-9a-f]{1,2}/i);
    if (macMatch) {
      return macMatch[0].toLowerCase();
    }
  } catch (error) {
    // arp command failed or not available
  }
  return undefined;
}

/**
 * Get vendor name from MAC address using online API
 */
async function getVendorFromMacOnline(mac: string): Promise<string | undefined> {
  try {
    const cleanMac = mac.replace(/[:-]/g, '').substring(0, 6);
    const response = await fetch(`https://api.macvendors.com/${cleanMac}`, {
      signal: AbortSignal.timeout(2000),
    });
    if (response.ok) {
      const vendor = await response.text();
      return vendor.trim();
    }
  } catch (error) {
    // API call failed, will fall back to local database
  }
  return undefined;
}

/**
 * Get vendor name from MAC address (first 3 octets = OUI)
 */
export async function getVendorFromMac(mac: string): Promise<string | undefined> {
  // Remove separators and get first 6 characters (OUI)
  const oui = mac.replace(/[:-]/g, '').substring(0, 6).toUpperCase();
  

  // Try local database first
  if (VendorByMacOUI[oui]) {
    return VendorByMacOUI[oui];
  }
  
  // If not found locally, try online API
  return await getVendorFromMacOnline(mac);
}

/**
 * Try to get NetBIOS name (works for Windows devices)
 */
export async function getNetBiosName(ip: string): Promise<string | undefined> {
  try {
    // Try nmblookup on Linux/macOS or nbtstat on Windows
    const commands = [
      `nmblookup -A ${ip} 2>/dev/null`,
      `nbtscan -q ${ip} 2>/dev/null`,
    ];
    
    for (const cmd of commands) {
      try {
        const { stdout } = await execAsync(cmd, { timeout: 3000 });
        if (stdout) {
          // Parse NetBIOS name from output
          const lines = stdout.split('\n');
          for (const line of lines) {
            // Look for device name (typically ends with <00> or <20>)
            const match = line.match(/\s+([A-Z0-9\-_]+)\s+<00>/i);
            if (match && match[1] !== 'WORKGROUP' && match[1] !== '__MSBROWSE__') {
              return match[1];
            }
          }
        }
      } catch {
        continue;
      }
    }
  } catch (error) {
    // NetBIOS lookup not available
  }
  return undefined;
}

/**
 * Try mDNS/Bonjour resolution (works for Apple devices and IoT)
 */
export async function getMdnsName(ip: string): Promise<string | undefined> {
  try {
    // Try to resolve .local domain
    const reverseName = ip.split('.').reverse().join('.') + '.in-addr.arpa';
    
    return new Promise((resolve) => {
      dns.resolveCname(reverseName, (err, addresses) => {
        if (!err && addresses && addresses.length > 0) {
          // Extract hostname from .local address
          const localName = addresses[0].replace('.local', '');
          resolve(localName);
        } else {
          resolve(undefined);
        }
      });
      
      // Timeout after 1 second
      setTimeout(() => resolve(undefined), 1000);
    });
  } catch (error) {
    return undefined;
  }
}

/**
 * Try to get hostname via SNMP (if enabled)
 */
export async function getSnmpInfo(ip: string): Promise<{ hostname?: string; description?: string } | undefined> {
  try {
    // Try snmpget for sysName and sysDescr (OIDs 1.3.6.1.2.1.1.5.0 and 1.3.6.1.2.1.1.1.0)
    const { stdout } = await execAsync(
      `snmpget -v2c -c public -t 1 ${ip} SNMPv2-MIB::sysName.0 SNMPv2-MIB::sysDescr.0 2>/dev/null`,
      { timeout: 2000 }
    );
    
    if (stdout) {
      const result: { hostname?: string; description?: string } = {};
      
      // Parse sysName
      const nameMatch = stdout.match(/SNMPv2-MIB::sysName\.0\s*=\s*STRING:\s*(.+)/);
      if (nameMatch) {
        result.hostname = nameMatch[1].trim();
      }
      
      // Parse sysDescr
      const descrMatch = stdout.match(/SNMPv2-MIB::sysDescr\.0\s*=\s*STRING:\s*(.+)/);
      if (descrMatch) {
        result.description = descrMatch[1].trim();
      }
      
      return result;
    }
  } catch (error) {
    // SNMP not available or failed
  }
  return undefined;
}

/**
 * Get SMB/Samba hostname (works for Linux with Samba and Windows)
 */
export async function getSmbHostname(ip: string): Promise<string | undefined> {
  try {
    // Try smbclient or nmblookup
    const commands = [
      `smbclient -L ${ip} -N -g 2>/dev/null | grep "Workstation" | cut -d'|' -f2`,
      `nmblookup -A ${ip} 2>/dev/null | grep "<00>" | grep -v "GROUP" | head -1 | awk '{print $1}'`,
    ];
    
    for (const cmd of commands) {
      try {
        const { stdout } = await execAsync(cmd, { timeout: 3000 });
        if (stdout && stdout.trim()) {
          const hostname = stdout.trim().split('\n')[0];
          if (hostname && hostname !== 'WORKGROUP' && hostname !== '__MSBROWSE__') {
            return hostname;
          }
        }
      } catch {
        continue;
      }
    }
  } catch (error) {
    // SMB lookup failed
  }
  return undefined;
}

/**
 * Try UPnP/SSDP discovery for device information
 */
export async function getUpnpInfo(ip: string): Promise<{ hostname?: string; deviceType?: string } | undefined> {
  return new Promise((resolve) => {
    try {
      const socket = dgram.createSocket('udp4');
      
      const message = Buffer.from(
        'M-SEARCH * HTTP/1.1\r\n' +
        'HOST: 239.255.255.250:1900\r\n' +
        'MAN: "ssdp:discover"\r\n' +
        'MX: 1\r\n' +
        'ST: ssdp:all\r\n\r\n'
      );
      
      let found = false;
      
      socket.on('message', (msg: Buffer, rinfo: any) => {
        if (rinfo.address === ip && !found) {
          found = true;
          const response = msg.toString();
          const result: { hostname?: string; deviceType?: string } = {};
          
          // Extract device info from UPnP response
          const serverMatch = response.match(/SERVER:\s*(.+)/i);
          if (serverMatch) {
            result.deviceType = serverMatch[1].trim();
          }
          
          socket.close();
          resolve(result);
        }
      });
      
      socket.on('error', (err) => {
        try {
          socket.close();
        } catch {}
        resolve(undefined);
      });
      
      // Send discovery packet
      socket.send(message, 1900, '239.255.255.250', (err: Error | null) => {
        if (err) {
          try {
            socket.close();
          } catch {}
          resolve(undefined);
        }
      });
      
      // Timeout after 1.5 seconds
      setTimeout(() => {
        try {
          socket.close();
        } catch {}
        if (!found) resolve(undefined);
      }, 1500);
    } catch (error) {
      resolve(undefined);
    }
  });
}

/**
 * Enhanced HTTP detection with more details
 */
export async function getEnhancedHttpInfo(ip: string, port: number, timeout: number = 3000): Promise<{ 
  server?: string; 
  hostname?: string;
  title?: string;
} | undefined> {
  return new Promise((resolve) => {
    const options = {
      hostname: ip,
      port: port,
      path: '/',
      method: 'GET',
      timeout: timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LanScanner/1.0)',
      },
    };

    const req = http.request(options, (res) => {
      const result: { server?: string; hostname?: string; title?: string } = {};
      
      // Get server info
      const server = res.headers['server'];
      const poweredBy = res.headers['x-powered-by'];
      if (server && typeof server === 'string') result.server = server;
      if (poweredBy && typeof poweredBy === 'string') {
        result.server = (result.server ? result.server + ' / ' : '') + poweredBy;
      }
      
      // Get hostname from headers
      const host = res.headers['host'];
      if (host && typeof host === 'string') result.hostname = host;
      
      // Try to get page title
      let body = '';
      res.on('data', (chunk) => {
        body += chunk.toString();
        // Stop after getting enough data for title
        if (body.length > 10000) {
          req.destroy();
        }
      });
      
      res.on('end', () => {
        const titleMatch = body.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
          result.title = titleMatch[1].trim();
        }
        resolve(Object.keys(result).length > 0 ? result : undefined);
      });
    });

    req.on('error', () => {
      resolve(undefined);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(undefined);
    });

    req.end();
  });
}

/**
 * Perform reverse DNS lookup to get hostname
 */
export async function getHostname(ip: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(undefined), 2000);
    
    dns.reverse(ip, (err, hostnames) => {
      clearTimeout(timeout);
      if (err || !hostnames || hostnames.length === 0) {
        resolve(undefined);
      } else {
        resolve(hostnames[0]);
      }
    });
  });
}

/**
 * Grab service banner from a port
 */
export async function grabBanner(ip: string, port: number, timeout: number = 2000): Promise<string | undefined> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let banner = '';
    let isResolved = false;

    const cleanup = () => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
      }
    };

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      // Send a generic probe
      socket.write('\r\n');
    });

    socket.on('data', (data) => {
      banner += data.toString('utf8');
      // Limit banner size
      if (banner.length > 1024) {
        cleanup();
        resolve(banner.substring(0, 1024));
      }
    });

    socket.on('timeout', () => {
      cleanup();
      resolve(banner || undefined);
    });

    socket.on('error', () => {
      cleanup();
      resolve(banner || undefined);
    });

    socket.on('end', () => {
      cleanup();
      resolve(banner || undefined);
    });

    try {
      socket.connect(port, ip);
    } catch (error) {
      cleanup();
      resolve(undefined);
    }

    // Set a maximum time to wait for data
    setTimeout(() => {
      if (!isResolved) {
        cleanup();
        resolve(banner || undefined);
      }
    }, timeout);
  });
}

/**
 * Get HTTP server information
 */
async function getHttpInfo(ip: string, port: number, timeout: number = 3000): Promise<string | undefined> {
  return new Promise((resolve) => {
    const options = {
      hostname: ip,
      port: port,
      path: '/',
      method: 'HEAD',
      timeout: timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LanScanner/1.0)',
      },
    };

    const req = http.request(options, (res) => {
      const server = res.headers['server'];
      const poweredBy = res.headers['x-powered-by'];
      
      let info = '';
      if (server) info += server;
      if (poweredBy) info += (info ? ' / ' : '') + poweredBy;
      
      resolve(info || undefined);
    });

    req.on('error', () => {
      resolve(undefined);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(undefined);
    });

    req.end();
  });
}

/**
 * Identify service based on port and banner
 */
export function identifyService(port: number, banner?: string): string | undefined {
  if (!banner) {
    // find in PortByServiceName the key that matches the port
    const serviceNames = Object.keys(PortByServiceName) as PortName[];
    const serviceName = serviceNames.find(key => PortByServiceName[key] === port);
    return serviceName
  }

  // Parse banner for service identification
  const bannerLower = banner.toLowerCase();
  
  // Check for OS information in SSH banner
  if (bannerLower.includes('ssh')) {
    const sshInfo = extractVersion(banner, 'SSH');
    // Try to detect OS
    if (bannerLower.includes('ubuntu')) return `SSH: ${sshInfo} (Ubuntu)`;
    if (bannerLower.includes('debian')) return `SSH: ${sshInfo} (Debian)`;
    if (bannerLower.includes('raspbian')) return `SSH: ${sshInfo} (Raspbian)`;
    if (bannerLower.includes('centos')) return `SSH: ${sshInfo} (CentOS)`;
    if (bannerLower.includes('red hat') || bannerLower.includes('redhat')) return `SSH: ${sshInfo} (Red Hat)`;
    if (bannerLower.includes('freebsd')) return `SSH: ${sshInfo} (FreeBSD)`;
    return `SSH: ${sshInfo}`;
  }
  
  if (bannerLower.includes('ftp')) return `FTP: ${extractVersion(banner, 'FTP')}`;
  if (bannerLower.includes('smtp')) return `SMTP: ${extractVersion(banner, 'SMTP')}`;
  if (bannerLower.includes('mysql')) return `MySQL: ${extractVersion(banner, 'MySQL')}`;
  if (bannerLower.includes('postgresql')) return `PostgreSQL`;
  if (bannerLower.includes('redis')) return `Redis`;
  if (bannerLower.includes('mongodb')) return `MongoDB`;
  if (bannerLower.includes('vnc')) return `VNC`;
  if (bannerLower.includes('microsoft')) return `Microsoft Service`;
  if (bannerLower.includes('telnet')) return `Telnet`;
  
  // Return first line if it looks like a banner
  const firstLine = banner.split('\n')[0].trim();
  if (firstLine.length > 0 && firstLine.length < 100) {
    return firstLine;
  }
  
  return undefined;
}

/**
 * Extract version from banner
 */
function extractVersion(banner: string, service: string): string {
  const lines = banner.split('\n');
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    // Remove common prefixes
    return firstLine.replace(/^220\s*/i, '').replace(/^SSH-[\d.]+-/i, '');
  }
  return service;
}
