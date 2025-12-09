import arg from 'arg'
import { ParsedCommandLineArgs } from './types'


/**
 * 
 * Parse command line arguments
 * 
 */
export function getCommandLineArgs():ParsedCommandLineArgs {
  try {
     return arg({
      // Required flags
      '--help': Boolean,
      '--ip': String, // IP range or CIDR notation
      '--ports': String, // Comma-separated port numbers or port group name
      '--timeout': Number, // Connection timeout in milliseconds
      '--concurrencyLimit': Number, // Number of concurrent connections
      '--identifyDevices': Boolean, // Attempt to identify devices (hostname, services)
      '--verbose': Boolean, // Show verbose identification details
      // Aliases
      '-h': '--help',
      '-t': '--timeout',
      '-c': '--concurrencyLimit',
      '-i': '--identifyDevices',
      '-v': '--verbose',
    });
  } catch (err) {
    if (err instanceof Error && err.message) {
      console.error('Error parsing args:', err.message);
    }
    displayCommandLineUsage();
    process.exit(1);
  }
};


/**
 * 
 * Display CLI usage information
 * 
 */
export function displayCommandLineUsage(): void {
  console.log('Usage: lanscan [options]');
  console.log('');
  console.log('Optional Arguments:');
  console.log('  --ip <range>         IP address, range, or CIDR notation (default: 192.168.1.1-192.168.1.254)');
  console.log('                       Examples: 192.168.1.1, 192.168.1.1-192.168.1.254, 192.168.1.0/24');
  console.log('  --ports <ports>      Comma-separated port numbers or port group name (default: Common)');
  console.log('                       Examples: 80,443,22 or Common or Web');
  console.log('');
  console.log('Examples:');
  console.log('  # Using all defaults (192.168.1.1-254, Common ports)');
  console.log('  lanscan');
  console.log('  lanscan --identify');
  console.log('');
  console.log('  # Using default IP range with custom ports');
  console.log('  lanscan --ports=80,443,22');
  console.log('  lanscan --ports=Web');
  console.log('');
  console.log('  # Using custom IP range with default ports');
  console.log('  lanscan --ip=192.168.1.0/24');
  console.log('  lanscan --ip=192.168.1.1-192.168.1.50');
  console.log('');
  console.log('  # Custom IP range and ports');
  console.log('  lanscan --ip=192.168.1.0/24 --ports=80,443,22');
  console.log('  lanscan --ip=192.168.1.1 --ports=22,80,443');
  console.log('');
  console.log('  # With device identification');
  console.log('  lanscan -i');
  console.log('  lanscan -i -v');
  console.log('');
  console.log('Available port groups:');
  console.log('  Web, FileTransfer, RemoteAccess, Email, Database, IoT,');
  console.log('  Media, Development, Docker, Monitoring, Network, FileSharing,');
  console.log('  Security, Gaming, Common, All');
  console.log('');
  console.log('Options:');
  console.log('  -h, --help                    Show this help message');
  console.log('  -t, --timeout <ms>            Connection timeout in milliseconds (default: 2000)');
  console.log('                                Increase for better reliability with IoT devices');
  console.log('                                (e.g. 3000-5000)');
  console.log('  -c, --concurrencyLimit <n>    Number of concurrent connections (default: 50)');
  console.log('                                Decrease for better reliability (e.g. 20-30)');
  console.log('  -i, --identifyDevices         Identify devices (hostname, services, device type)');
  console.log('  -v, --verbose                 Show detailed identification information');
}

