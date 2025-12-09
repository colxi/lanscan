# LAN Scanner

A fast and efficient TypeScript-based network scanner for discovering hosts and open ports on your local network.

## Features

- 🚀 Fast concurrent scanning with configurable concurrency
- 📊 Support for CIDR notation (e.g., `192.168.1.0/24`)
- 📍 Support for IP ranges (e.g., `192.168.1.1-192.168.1.254`)
- 🎯 Multi-port scanning
- ⏱️ Configurable timeout
- 📈 Real-time progress tracking
- 📋 Formatted table output with results
- 🔍 **Hybrid host detection** - Uses ICMP ping + ARP table lookup for maximum reliability
- 🏷️ **Port groups** - Use predefined port collections (Web, IoT, Database, etc.)
- 🔎 **Device identification** - Discover hostnames, services, and device types with MAC vendor lookup
- 💻 **CLI & Programmatic API** - Use as a command-line tool or import as a library

## Installation

```bash
# Install dependencies
pnpm install
```

## Usage

### Command Line

```bash
# Using pnpm
pnpm start --ip=192.168.1.0/24 --ports=80,443,22
```

**Examples:**

```bash
# Scan a CIDR range with specific ports
pnpm start --ip=192.168.1.0/24 --ports=80,443,22

# Scan using predefined port groups
pnpm start --ip=192.168.1.0/24 --ports=Web
pnpm start --ip=192.168.1.0/24 --ports=IoT
pnpm start --ip=192.168.1.0/24 --ports=Common

# Scan all defined ports (comprehensive scan)
pnpm start --ip=192.168.1.0/24 --ports=All

# Scan an IP range
pnpm start --ip=192.168.1.1-192.168.1.50 --ports=22,3389

# Scan a single IP
pnpm start --ip=192.168.1.1 --ports=22,80,443

# With custom timeout and concurrency
pnpm start --ip=192.168.1.0/24 --ports=80,443 --timeout=3000 --concurrency=100
```

**Available Port Groups:**
- `Web` - HTTP, HTTPS, common web ports (80, 443, 8080, 8443)
- `IoT` - Smart home and IoT devices (HomeAssistant, MQTT, etc.)
- `Database` - MySQL, PostgreSQL, MongoDB, Redis, etc.
- `RemoteAccess` - SSH, RDP, VNC, Telnet
- `Media` - Plex, Jellyfin, streaming services
- `Development` - Node.js, React, Django, Flask dev servers
- `Docker` - Docker, Kubernetes, Portainer
- `FileTransfer` - FTP, SFTP, TFTP
- `Email` - SMTP, POP3, IMAP
- `Gaming` - Minecraft, Steam, TeamSpeak
- `Security` - Security cameras and surveillance
- `Common` - Most frequently scanned ports
- `All` - Every defined port (comprehensive scan)

See `src/constants/ports.ts` for complete list of port groups.

### Programmatic Usage (Node.js)

```typescript
import { scanLan, CommonPorts, PortByServiceName } from 'lanscan';

// Scan with specific ports
const results = await scanLan({
  startIp: '192.168.1.1',
  endIp: '192.168.1.254',
  ports: [22, 80, 443, 8080],
  timeout: 2000,        // Optional, default: 2000ms
  concurrencyLimit: 50, // Optional, default: 50
});

// Or use predefined port groups
const iotResults = await scanLan({
  startIp: '192.168.1.1',
  endIp: '192.168.1.254',
  ports: CommonPorts.IoT,
});

// Or specific services
const webResults = await scanLan({
  startIp: '192.168.1.1',
  endIp: '192.168.1.254',
  ports: [
    PortByServiceName.HTTP, 
    PortByServiceName.HTTPS, 
    PortByServiceName.HTTP_ALT
  ],
});

console.log(results);
// Output format:
// {
//   '192.168.1.1': {
//     detectionMethod: 'ping' | 'arp' | 'port-scan',
//     openPorts: [80, 443],
//     identity: {
//       hostname: 'router.local',
//       deviceType: 'TP-Link Router',
//       identificationMethod: 'MAC Vendor'
//     }
//   },
//   ...
// }
```

## Options

### Command Line Flags

- `--ip <value>`: IP address, range, or CIDR notation (required)
  - Single IP: `--ip=192.168.1.1`
  - Range: `--ip=192.168.1.1-192.168.1.254`
  - CIDR: `--ip=192.168.1.0/24`
  
- `--ports <value>`: Ports to scan (required)
  - Comma-separated: `--ports=22,80,443`
  - Port group: `--ports=Web` or `--ports=Common`
  - All ports: `--ports=All`
  
- `--timeout <ms>`: Connection timeout in milliseconds (default: 2000)
- `--concurrency <n>`: Number of concurrent connections (default: 50)
- `--help`: Display help information

### Configuration Object (Programmatic API)

```typescript
interface ScanConfig {
  startIp: string;         // Start IP address
  endIp: string;           // End IP address
  ports: number[];         // Array of ports to scan
  timeout?: number;        // Connection timeout (default: 2000)
  concurrencyLimit?: number; // Concurrent connections (default: 50)
}
```

## Device Identification

The scanner automatically identifies devices using multiple techniques:

### Identification Methods

1. **MAC Address Vendor Lookup** - Identifies device manufacturer from MAC address
   - Recognizes 100+ vendors including Apple, Samsung, Google, Amazon, Raspberry Pi, etc.
   - Most reliable method for device identification
   - Uses ARP table lookups to get MAC addresses
   
2. **Reverse DNS** - Hostname resolution via DNS
   - Retrieves domain names associated with IP addresses
   
3. **NetBIOS Name Resolution** - For Windows devices
   - Retrieves computer names from Windows machines
   
4. **mDNS/Bonjour** - For Apple devices and IoT
   - Discovers .local names used by Apple devices and smart home equipment

5. **SNMP Queries** (Port 161) - For network equipment and servers
   - Retrieves system name and description
   - Identifies OS type (Linux, Windows, FreeBSD, Cisco, MikroTik)
   - Works on routers, switches, and servers with SNMP enabled

6. **SMB/Samba** (Port 445) - For Linux with Samba and Windows
   - Retrieves workstation names
   - Works for Linux file servers and Windows computers

7. **UPnP/SSDP Discovery** - For smart devices and media equipment
   - Discovers device types via multicast
   - Works for smart TVs, media players, IoT devices

8. **Enhanced HTTP Detection** - Web server analysis
   - Extracts server software and versions
   - Reads page titles to identify specific services (Home Assistant, pfSense, Synology, etc.)
   - Detects operating systems from web interfaces

9. **SSH Banner Grabbing** (Port 22) - For Linux/Unix servers
   - Identifies SSH version and OS distribution
   - Detects Ubuntu, Debian, Raspbian, CentOS, Red Hat, FreeBSD

10. **Service Banner Detection** - For various services
    - FTP, SMTP, MySQL, PostgreSQL, Redis, MongoDB
    - Extracts version information and software details

### Example Output

```bash
pnpm start --ip=192.168.1.0/24 --ports=Common
```

Output:
```
🔍 Starting
🔍 Scanning 254 ip addresses...
⭐️ Found 13 devices
🔍 Scanning 110 ports in 13 devices...
⭐️ Port scan completed
🔍 Identifying 13 devices...
⭐️ Device identification completed
✅ Done!

┌─────────┬─────────────────┬─────────────────┬─────────────┬────────────────────────────┬────────────────────────────┬───────────────────────────────┐
│ (index) │ ip              │ detectionMethod │ openPorts   │ identity.hostname          │ identity.deviceType        │ identity.identificationMethod │
├─────────┼─────────────────┼─────────────────┼─────────────┼────────────────────────────┼────────────────────────────┼───────────────────────────────┤
│ 0       │ '192.168.1.1'   │ 'ping'          │ [ 80, 443 ] │ 'TP-Link Systems Inc.'     │ 'TP-Link Systems Inc.'     │ 'MAC Vendor'                  │
│ 1       │ '192.168.1.128' │ 'ping'          │ []          │ 'Tasmota'                  │ 'Tasmota'                  │ 'MAC Vendor'                  │
│ 2       │ '192.168.1.129' │ 'ping'          │ []          │ 'Espressif Inc.'           │ 'Espressif Inc.'           │ 'MAC Vendor'                  │
│ 3       │ '192.168.1.137' │ 'ping'          │ [ 8443 ]    │ 'LG Innotek'               │ 'LG Innotek'               │ 'MAC Vendor'                  │
└─────────┴─────────────────┴─────────────────┴─────────────┴────────────────────────────┴────────────────────────────┴───────────────────────────────┘
```

### Recognized Device Types

- **Apple devices** - iPhones, iPads, MacBooks, Apple TV (via MAC address + mDNS)
- **Raspberry Pi** - All Raspberry Pi models (via MAC address)
- **Linux Servers** - Ubuntu, Debian, CentOS, Red Hat, FreeBSD (via SSH banner + SNMP)
- **Windows Computers** - Desktops and laptops (via NetBIOS + SMB)
- **Smart Home** - Google Home/Nest, Amazon Echo, Philips Hue, Sonos, Tasmota (via MAC + UPnP)
- **Network Equipment** - Ubiquiti, TP-Link, Netgear, Asus, Cisco routers (via MAC + SNMP)
- **NAS devices** - Synology, QNAP (via MAC + HTTP title detection)
- **IoT Devices** - Smart TVs, media players, home automation (via UPnP + mDNS)
- **ESP Devices** - ESP8266, ESP32 (via MAC address)
- **Other devices** - Samsung, Xiaomi, Nintendo, HP printers, and more

## Host Discovery Mechanism

The scanner uses a **multi-layered approach** for maximum reliability:

### 1. ICMP Ping (Primary)
- Fast initial check using ICMP echo requests
- Detects devices even if all ports are closed/filtered
- Especially reliable for IoT devices and mobile devices
- Works without elevated privileges on most systems

### 2. ARP Table Lookup (Secondary)
- Checks the system's ARP cache for device presence
- Detects devices on the local network that may not respond to ping
- Works for devices with strict firewall rules
- Platform-specific command execution (`arp -a` on Unix/Windows)

### 3. TCP Port Scanning (Tertiary)
- If both ping and ARP fail, performs TCP port scanning
- Analyzes TCP connection responses to detect host presence
- Detects hosts behind strict firewalls that block both ICMP and don't update ARP
- Considers a host alive if any port responds (even with connection refused)

**Result:** A host is considered alive if **any** of the three methods succeeds: ping response, ARP table entry, or TCP port response.

This multi-layered approach provides:
- ✅ **Maximum reliability** - Detects virtually all responsive devices
- ✅ **Faster scanning** - Ping is quicker than TCP handshakes
- ✅ **IoT-friendly** - Reliably detects low-power devices
- ✅ **Firewall-aware** - Falls back to ARP and TCP if ICMP is blocked
- ✅ **Comprehensive coverage** - Three independent detection methods

### Performance Note:
Device identification occurs sequentially per device (not in parallel) to ensure stability and avoid overwhelming devices. The scanner processes:
- ARP lookups for MAC addresses
- DNS queries
- NetBIOS queries (for Windows)
- SNMP queries (if port 161 is open)
- SMB queries (if port 445 is open)
- UPnP multicast discovery
- HTTP requests for web-enabled devices
- Service detection and banner grabbing

This sequential approach ensures reliable identification without causing network congestion or device timeouts.

## Host Detection

The scanner shows **all detected hosts**, including those without open ports. A host is considered "detected" if it responds to ICMP ping, is present in the ARP table, or responds to TCP port scans, indicating it's alive on the network.

- **Open ports**: Ports that accepted connections
- **No open ports (host alive)**: Host detected via ping, ARP, or port scanning but no ports were open on the scanned ports
- **Detection methods**: Results show how each host was discovered (`ping`, `arp`, or `port-scan`)

## Examples

Scan your local network for web servers:
```bash
pnpm start --ip=192.168.1.0/24 --ports=Web
# or with specific ports
pnpm start --ip=192.168.1.0/24 --ports=80,443,8080
```

Scan for IoT and smart home devices:
```bash
pnpm start --ip=192.168.1.0/24 --ports=IoT
```

Scan for SSH and RDP services:
```bash
pnpm start --ip=192.168.1.0/24 --ports=RemoteAccess
# or specific ports
pnpm start --ip=192.168.1.0/24 --ports=22,3389
```

Fast scan with higher concurrency:
```bash
pnpm start --ip=192.168.1.0/24 --ports=Common --concurrency=200 --timeout=1000
```

Complete network inventory with all ports:
```bash
pnpm start --ip=192.168.1.0/24 --ports=All
```

## Output

The scanner displays:
1. Progress messages during each phase:
   - Device discovery (ping + ARP)
   - Port scanning
   - Device identification
2. A formatted table with discovered hosts and their information:
   - IP address
   - Detection method (ping or arp)
   - Open ports (as an array)
   - Device identity (hostname, device type, identification method)
3. Clean, structured output suitable for logging and analysis

Example output:
```
🔍 Starting
🔍 Scanning 254 ip addresses...
⭐️ Found 13 devices
🔍 Scanning 110 ports in 13 devices...
⭐️ Port scan completed
🔍 Identifying 13 devices...
⭐️ Device identification completed
✅ Done!

┌┬────────────────┬─────────────────┬─────────────┬────────────────────────────┬───────────────────────────────┐
│ ip              │ detectionMethod │ openPorts   │ identity.hostname          │ identity.identificationMethod │
├─────────────────┼─────────────────┼─────────────┼────────────────────────────┼───────────────────────────────┤
│ '192.168.1.1'   │ 'ping'          │ [ 80, 443 ] │ 'TP-Link Systems Inc.'     │ 'MAC Vendor'                  │
│ '192.168.1.128' │ 'ping'          │ []          │ 'Tasmota'                  │ 'MAC Vendor'                  │
└─────────────────┴─────────────────┴─────────────┴────────────────────────────┴───────────────────────────────┘
```

## Project Structure

The project is organized into domain-focused modules for better maintainability and separation of concerns:

```
src/
├── index.ts                    # Main entry point and public API
├── index.cli.ts                # CLI-specific logic
├── index.node.ts               # Node.js programmatic API
├── types/                      # Shared type definitions
│   └── index.ts
├── constants/                  # Port definitions and mappings
│   ├── index.ts
│   └── ports.ts
├── config/                     # Configuration management
│   ├── index.ts
│   └── types/
│       └── index.ts           # ScanConfig
├── cli/                        # CLI argument parsing
│   ├── index.ts
│   └── types/
│       └── index.ts           # CLI argument types
├── device-discovery/           # Network host discovery
│   ├── index.ts
│   ├── types/
│   │   └── index.ts           # NetworkScanResult types
│   └── helpers/
│       └── is-device-alive.ts # Ping + ARP detection
├── port-scan/                  # Port scanning
│   ├── index.ts
│   └── helpers/
│       ├── tcp.ts             # TCP port checking
│       └── device-has-open-ports.ts
├── device-identity/            # Device identification
│   ├── index.ts
│   ├── types/
│   │   └── index.ts           # DeviceIdentity types
│   └── helpers/
│       └── index.ts           # DNS, MAC, NetBIOS, SNMP, etc.
├── utils/                      # Shared utilities
│   ├── array/                 # Array utilities
│   ├── concurrency/           # Parallel execution control
│   ├── network/               # Network utilities (IP, ports)
│   ├── object/                # Object utilities (merge, flatten)
│   ├── promise/               # Promise utilities (timeout, retry)
│   └── sleep.ts               # Delay utility
└── network-scan/               # Legacy (to be removed)
```

### Module Responsibilities

- **device-discovery**: Low-level host discovery using ICMP ping and ARP table lookup
- **port-scan**: TCP port scanning for discovered devices
- **device-identity**: Device fingerprinting and identification (DNS, MAC vendor, NetBIOS, etc.)
- **config**: Configuration management for CLI and programmatic usage
- **cli**: Command-line argument parsing and validation
- **constants**: Port definitions and service mappings
- **utils**: Reusable utilities for common operations
- **types**: Shared type definitions used across modules

### Key Design Patterns

- **Modular Architecture**: Each feature is isolated in its own module
- **Type Safety**: Full TypeScript coverage with strict typing
- **Async/Await**: Modern async patterns throughout
- **Error Handling**: Graceful degradation and detailed error messages
- **Sequential Device Processing**: Devices identified one at a time to ensure stability
- **Utility Functions**: Reusable utilities for object manipulation, promises, and concurrency

## Performance Tips

- Increase `--concurrency` for faster scans (but be mindful of network/system limits)
  - Default: 50
  - Recommended range: 50-200
  - Higher values may cause network congestion

- Decrease `--timeout` for faster scans of responsive networks
  - Default: 2000ms
  - Responsive networks: 1000ms
  - Slow networks: 3000-5000ms

- Scan specific ports rather than large port ranges for better performance
  - Use port groups (`Web`, `Common`) instead of `All` when possible
  - Target specific services rather than scanning all ports

- Device identification is sequential per device
  - This ensures stable and reliable identification
  - Each device is processed completely before moving to the next
  - No parallel processing to avoid overwhelming devices

## Technical Notes

### Utilities

The project includes several utility modules for common operations:

- **Object Utilities** (`src/utils/object/`)
  - `mergeObjects`: Deep merge multiple objects with type inference
  - `flattenObject`: Flatten nested objects to dot-notation keys (arrays preserved)

- **Promise Utilities** (`src/utils/promise/`)
  - `callAsyncMethodWithTimeout`: Execute async functions with timeout and retry capabilities
  - Uses internal symbols to avoid collision with legitimate return values

- **Concurrency Utilities** (`src/utils/concurrency/`)
  - `parallelize`: Execute tasks in parallel with configurable concurrency limit

- **Network Utilities** (`src/utils/network/`)
  - IP address parsing, CIDR notation, range generation
  - IP sorting by numeric value
  - Port status checking

### Testing

The project includes comprehensive test coverage using Jest:

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test src/utils/object/merge.spec.ts

# Run tests in watch mode
pnpm test:watch
```

## License

ISC

## Contributing

Contributions are welcome! Please ensure:
1. All tests pass before submitting a PR
2. Add tests for new features
3. Follow the existing code style and structure
4. Update documentation for user-facing changes
