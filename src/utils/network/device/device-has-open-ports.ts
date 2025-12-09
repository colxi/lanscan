import { getPortStatus } from '../port/get-port-status'

const MAX_CONCURRENT_PORTS = 5;

export const deviceHasOpenPorts = async (ip: string, ports: number[], timeout: number): Promise<boolean> => {
  // Check ports in batches to avoid EBADF error
  // Stop immediately when first open port is found
  for (let i = 0; i < ports.length; i += MAX_CONCURRENT_PORTS) {
    const batch = ports.slice(i, i + MAX_CONCURRENT_PORTS);
    const hasOpenPort = await hasAnyDeviceAnOpenPort(ip, batch, timeout);
    if (hasOpenPort) {
      return true;
    }
  }
  return false;
}

const hasAnyDeviceAnOpenPort = async (ip: string, portBatch: number[], timeout: number): Promise<boolean> => {
  return new Promise<boolean>((resolve) => {
    let completedChecks = 0;
    let resolved = false;

    for (const port of portBatch) {
      getPortStatus(ip, port, timeout)
        .then((result) => {
          if (result === 'open' && !resolved) {
            resolved = true;
            resolve(true);
          } else {
            completedChecks++;
            if (completedChecks === portBatch.length && !resolved) {
              resolved = true;
              resolve(false);
            }
          }
        })
        .catch(() => {
          completedChecks++;
          if (completedChecks === portBatch.length && !resolved) {
            resolved = true;
            resolve(false);
          }
        });
    }
  });
}