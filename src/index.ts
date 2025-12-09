// Run the CLI if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const { lanScanCLI } = await import('./index.cli')
  await lanScanCLI();
}


// Public resources
export { lanScanProgrammatic as lanScan } from './index.node'
export { PortByServiceName, CommonPorts } from './constants/';
export type { ScanConfig } from './config/types/'
