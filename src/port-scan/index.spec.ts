import { getDevicesOpenPorts } from './index'
import * as config from '../config'
import * as portStatus from '../utils/network/port/get-port-status'

const mockGetConfig = jest.fn()
const mockGetPortStatus = jest.fn()

jest.mock('../config', () => ({
  getConfig: (...args: any[]) => mockGetConfig(...args)
}))

jest.mock('../utils/network/port/get-port-status', () => ({
  getPortStatus: (...args: any[]) => mockGetPortStatus(...args)
}))

describe('getDevicesOpenPorts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetConfig.mockReturnValue({
      ports: [80, 443, 22, 21, 3389],
      timeout: 2000,
      concurrencyLimit: 10
    })
    mockGetPortStatus.mockResolvedValue('closed')
  })

  describe('single device scanning', () => {
    it('should scan a single device and return open ports', async () => {
      mockGetPortStatus
        .mockResolvedValueOnce('open')   // port 80
        .mockResolvedValueOnce('closed') // port 443
        .mockResolvedValueOnce('open')   // port 22
        .mockResolvedValueOnce('closed') // port 21
        .mockResolvedValueOnce('closed') // port 3389

      const result = await getDevicesOpenPorts(['192.168.1.100'])

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        ip: '192.168.1.100',
        ports: [80, 22]
      })
    })

    it('should return empty ports array when no ports are open', async () => {
      mockGetPortStatus.mockResolvedValue('closed')

      const result = await getDevicesOpenPorts(['192.168.1.100'])

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        ip: '192.168.1.100',
        ports: []
      })
    })

    it('should return all ports when all are open', async () => {
      mockGetPortStatus.mockResolvedValue('open')

      const result = await getDevicesOpenPorts(['192.168.1.100'])

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        ip: '192.168.1.100',
        ports: [80, 443, 22, 21, 3389]
      })
    })
  })

  describe('multiple devices scanning', () => {
    it('should scan multiple devices', async () => {
      // First device: ports 80 and 443 open
      mockGetPortStatus
        .mockResolvedValueOnce('open')   // 192.168.1.100:80
        .mockResolvedValueOnce('open')   // 192.168.1.100:443
        .mockResolvedValueOnce('closed') // 192.168.1.100:22
        .mockResolvedValueOnce('closed') // 192.168.1.100:21
        .mockResolvedValueOnce('closed') // 192.168.1.100:3389
        // Second device: port 22 open
        .mockResolvedValueOnce('closed') // 192.168.1.101:80
        .mockResolvedValueOnce('closed') // 192.168.1.101:443
        .mockResolvedValueOnce('open')   // 192.168.1.101:22
        .mockResolvedValueOnce('closed') // 192.168.1.101:21
        .mockResolvedValueOnce('closed') // 192.168.1.101:3389

      const result = await getDevicesOpenPorts(['192.168.1.100', '192.168.1.101'])

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        ip: '192.168.1.100',
        ports: [80, 443]
      })
      expect(result[1]).toEqual({
        ip: '192.168.1.101',
        ports: [22]
      })
    })

    it('should handle mix of devices with and without open ports', async () => {
      mockGetPortStatus.mockImplementation((ip, port) => {
        if (ip === '192.168.1.100' && port === 80) return Promise.resolve('open')
        return Promise.resolve('closed')
      })

      const result = await getDevicesOpenPorts(['192.168.1.100', '192.168.1.101', '192.168.1.102'])

      expect(result).toHaveLength(3)
      expect(result[0].ports).toEqual([80])
      expect(result[1].ports).toEqual([])
      expect(result[2].ports).toEqual([])
    })
  })

  describe('batching behavior', () => {
    it('should scan ports in batches of 5', async () => {
      mockGetConfig.mockReturnValue({
        ports: [80, 443, 22, 21, 3389, 8080, 3306, 5432, 27017, 6379], // 10 ports
        timeout: 2000,
        concurrencyLimit: 1
      })
      mockGetPortStatus.mockResolvedValue('closed')

      await getDevicesOpenPorts(['192.168.1.100'])

      // Should be called 10 times (all ports checked)
      expect(mockGetPortStatus).toHaveBeenCalledTimes(10)
    })

    it('should handle non-divisible port count', async () => {
      mockGetConfig.mockReturnValue({
        ports: [80, 443, 22], // 3 ports
        timeout: 2000,
        concurrencyLimit: 1
      })
      mockGetPortStatus.mockResolvedValue('closed')

      await getDevicesOpenPorts(['192.168.1.100'])

      expect(mockGetPortStatus).toHaveBeenCalledTimes(3)
    })
  })

  describe('port status handling', () => {
    it('should ignore unreachable ports', async () => {
      mockGetPortStatus
        .mockResolvedValueOnce('open')        // port 80
        .mockResolvedValueOnce('unreachable') // port 443
        .mockResolvedValueOnce('closed')      // port 22
        .mockResolvedValueOnce('unreachable') // port 21
        .mockResolvedValueOnce('open')        // port 3389

      const result = await getDevicesOpenPorts(['192.168.1.100'])

      expect(result[0].ports).toEqual([80, 3389])
    })

    it('should only include ports with "open" status', async () => {
      mockGetPortStatus
        .mockResolvedValueOnce('open')
        .mockResolvedValueOnce('closed')
        .mockResolvedValueOnce('closed')
        .mockResolvedValueOnce('closed')
        .mockResolvedValueOnce('open')

      const result = await getDevicesOpenPorts(['192.168.1.100'])

      expect(result[0].ports).toHaveLength(2)
      expect(result[0].ports).toEqual([80, 3389])
    })
  })

  describe('error handling', () => {
    it('should continue scanning even if some port checks fail', async () => {
      mockGetPortStatus
        .mockRejectedValueOnce(new Error('Connection error'))
        .mockResolvedValueOnce('open')
        .mockResolvedValueOnce('closed')
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce('open')

      const result = await getDevicesOpenPorts(['192.168.1.100'])

      // Should still get the successful ones
      expect(result[0].ports).toEqual([443, 3389])
    })

    it('should handle all ports failing gracefully', async () => {
      mockGetPortStatus.mockRejectedValue(new Error('Network error'))

      const result = await getDevicesOpenPorts(['192.168.1.100'])

      expect(result[0]).toEqual({
        ip: '192.168.1.100',
        ports: []
      })
    })
  })

  describe('configuration usage', () => {
    it('should use timeout from config', async () => {
      mockGetConfig.mockReturnValue({
        ports: [80],
        timeout: 5000,
        concurrencyLimit: 10
      })
      mockGetPortStatus.mockResolvedValue('open')

      await getDevicesOpenPorts(['192.168.1.100'])

      expect(mockGetPortStatus).toHaveBeenCalledWith('192.168.1.100', 80, 5000)
    })

    it('should respect concurrency limit', async () => {
      mockGetConfig.mockReturnValue({
        ports: [80],
        timeout: 2000,
        concurrencyLimit: 5
      })
      mockGetPortStatus.mockResolvedValue('closed')

      const ips = Array.from({ length: 20 }, (_, i) => `192.168.1.${i + 1}`)
      await getDevicesOpenPorts(ips)

      // All devices should be scanned
      expect(mockGetPortStatus).toHaveBeenCalledTimes(20)
    })

    it('should pass correct ip, port, and timeout to getPortStatus', async () => {
      mockGetPortStatus.mockResolvedValue('closed')

      await getDevicesOpenPorts(['10.0.0.5'])

      expect(mockGetPortStatus).toHaveBeenCalledWith('10.0.0.5', 80, 2000)
      expect(mockGetPortStatus).toHaveBeenCalledWith('10.0.0.5', 443, 2000)
      expect(mockGetPortStatus).toHaveBeenCalledWith('10.0.0.5', 22, 2000)
      expect(mockGetPortStatus).toHaveBeenCalledWith('10.0.0.5', 21, 2000)
      expect(mockGetPortStatus).toHaveBeenCalledWith('10.0.0.5', 3389, 2000)
    })
  })

  describe('edge cases', () => {
    it('should handle empty IP array', async () => {
      const result = await getDevicesOpenPorts([])

      expect(result).toEqual([])
      expect(mockGetPortStatus).not.toHaveBeenCalled()
    })

    it('should handle single port in config', async () => {
      mockGetConfig.mockReturnValue({
        ports: [80],
        timeout: 2000,
        concurrencyLimit: 10
      })
      mockGetPortStatus.mockResolvedValue('open')

      const result = await getDevicesOpenPorts(['192.168.1.100'])

      expect(result[0].ports).toEqual([80])
      expect(mockGetPortStatus).toHaveBeenCalledTimes(1)
    })

    it('should handle large number of ports', async () => {
      const largePorts = Array.from({ length: 100 }, (_, i) => i + 1)
      mockGetConfig.mockReturnValue({
        ports: largePorts,
        timeout: 2000,
        concurrencyLimit: 1
      })
      mockGetPortStatus.mockResolvedValue('closed')

      await getDevicesOpenPorts(['192.168.1.100'])

      expect(mockGetPortStatus).toHaveBeenCalledTimes(100)
    })
  })
})

