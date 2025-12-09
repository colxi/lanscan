
export type PortScanResultEntry = { 
  openPorts: number[]
}

export type PortScanResults = Record<string, PortScanResultEntry>
