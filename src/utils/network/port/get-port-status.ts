import * as net from 'net';

/**
 * Port check status
 */
export type PortStatus = 'open' | 'closed' | 'unreachable';


/**
 * Check if a specific port is open on a host
 * Returns 'open', 'closed', or 'unreachable'
 */
export function getPortStatus(ip: string, port: number, timeout: number = 2000): Promise<PortStatus> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isResolved = false;

    const cleanup = () => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
      }
    };

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      cleanup();
      resolve('open');
    });

    socket.on('timeout', () => {
      cleanup();
      resolve('unreachable');
    });

    socket.on('error', (err: NodeJS.ErrnoException) => {
      cleanup();
      // ECONNREFUSED = host exists but port is closed (definite device presence)
      if (err.code === 'ECONNREFUSED') {
        resolve('closed');
      } 
      // ECONNRESET/EPIPE = connection was established then dropped (device exists)
      else if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
        resolve('closed');
      }
      // Network unreachable errors (no device)
      else if (err.code === 'EHOSTUNREACH' || err.code === 'ENETUNREACH' || 
               err.code === 'EHOSTDOWN') {
        resolve('unreachable');
      }
      // Timeout errors (no device or firewall)
      else if (err.code === 'ETIMEDOUT') {
        resolve('unreachable');
      }
      // For any other error, be conservative but check if it might be a device
      else {
        // Some devices return weird errors but still exist
        // If we got far enough to get an error response, there might be a device
        resolve('unreachable');
      }
    });

    try {
      socket.connect(port, ip);
    } catch (error) {
      cleanup();
      resolve('unreachable');
    }
  });
}

