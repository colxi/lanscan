/**
 * Device identification type definitions
 */

/**
 * Device identification information
 */
export interface DeviceIdentity {
  hostname?: string;
  services?: Record<number, string>; // port -> service info
  httpServer?: string;
  deviceType?: string;
  identificationMethod?: string; // Method used to identify (DNS, MAC, NetBIOS, etc.)
}


export type DeviceIdentityEntry = { 
  identity: DeviceIdentity 
}

export type DeviceIdentityResult = Record<string, DeviceIdentityEntry>
