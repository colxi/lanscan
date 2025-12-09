import { execAsync } from '../../exec/exec-async'

export async function isDeviceInArpTable(ip: string): Promise<boolean> {
    const arpCmd = process.platform === 'win32'
      ? `arp -a ${ip}`
      : `arp -n ${ip}`;
    
    const { stdout } = await execAsync(arpCmd);
    
    // Check if we got a valid MAC address (not incomplete/empty)
    const hasMac = /([0-9A-Fa-f]{1,2}[:-]){5}([0-9A-Fa-f]{1,2})/.test(stdout);
    
    return hasMac;
}