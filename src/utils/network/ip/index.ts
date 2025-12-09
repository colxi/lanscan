import { IpRange } from '../../../types'

/**
 * 
 * Validate an IP address format
 * 
 */
export function isValidIpAddress(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255;
  });
}

/**
 * Parse CIDR notation (e.g., 192.168.1.0/24) to start and end IPs
 */
export function parseCIDR(cidr: string): IpRange {
  const [baseIp, prefixLength] = cidr.split('/');
  const prefix = parseInt(prefixLength, 10);
  
  if (isNaN(prefix) || prefix < 0 || prefix > 32) {
    throw new Error('Invalid CIDR notation');
  }
  
  const baseNum = ipToNumber(baseIp);
  const mask = (0xffffffff << (32 - prefix)) >>> 0;
  const networkNum = (baseNum & mask) >>> 0;
  const broadcastNum = (networkNum | ~mask) >>> 0;
  
  return {
    startIp: numberToIp(networkNum + 1), // Skip network address
    endIp: numberToIp(broadcastNum - 1),  // Skip broadcast address
  };
}

/**
 * Convert number back to IP address string
 */
export function numberToIp(num: number): string {
  return [
    (num >>> 24) & 0xff,
    (num >>> 16) & 0xff,
    (num >>> 8) & 0xff,
    num & 0xff,
  ].join('.');
}


/**
 * Parse IP address to a number for easy manipulation
 */
export function ipToNumber(ip: string): number {
  const parts = ip.split('.').map(Number);
  return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}


/**
 * Generate an array of IP addresses from start to end
 */
export function generateIpRange(startIp: string, endIp: string): string[] {
  const startNum = ipToNumber(startIp);
  const endNum = ipToNumber(endIp);

  if (startNum > endNum) {
    throw new Error('Start IP must be less than or equal to end IP');
  }

  const ipAddresses: string[] = [];
  for (let i = startNum; i <= endNum; i++) {
    ipAddresses.push(numberToIp(i));
  }

  return ipAddresses;
}


/**
 * Parse command line arguments for IP range
 */
export function parseIpRange(rangeArg: string): IpRange {
  if (rangeArg.includes('/')) {
    // CIDR notation
    return parseCIDR(rangeArg);
  } else if (rangeArg.includes('-')) {
    // Range notation
    const parts = rangeArg.split('-');
    return {
      startIp: parts[0].trim(),
      endIp: parts[1].trim(),
    };
  } else {
    // Single IP
    return {
      startIp: rangeArg,
      endIp: rangeArg,
    };
  }
}


