/**
 * ICMP ping utilities
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Check if a host responds to ICMP ping
 * Returns true if host is alive, false otherwise
 */
export async function pingDevice(ip: string, timeout: number = 1000): Promise<boolean> {
  try {
    // Use platform-specific ping command
    const isWindows = process.platform === 'win32';
    const pingCmd = isWindows 
      ? `ping -n 1 -w ${timeout} ${ip}` 
      : `ping -c 1 -W ${Math.ceil(timeout / 1000)} ${ip}`;
    
    await execAsync(pingCmd, { timeout: timeout + 500 });
    return true;
  } catch (error) {
    return false;
  }
}


