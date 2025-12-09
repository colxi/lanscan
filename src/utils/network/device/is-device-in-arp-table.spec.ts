import { isDeviceInArpTable } from './is-device-in-arp-table'

const mockExecAsync = jest.fn()

jest.mock('../../../../utils/exec-async', () => ({
  execAsync: (...args: any[]) => mockExecAsync(...args)
}))

describe('isDeviceInArpTable', () => {
  const originalPlatform = process.platform

  beforeEach(() => {
    jest.clearAllMocks()
    mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' })
  })

  afterAll(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform
    })
  })

  describe('platform-specific command', () => {
    it('should use "arp -a" on Windows', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true
      })
      mockExecAsync.mockResolvedValueOnce({ stdout: '', stderr: '' })

      await isDeviceInArpTable('192.168.1.100')

      expect(mockExecAsync).toHaveBeenCalledWith('arp -a 192.168.1.100')
    })

    it('should use "arp -n" on Unix-like systems (darwin)', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        configurable: true
      })
      mockExecAsync.mockResolvedValueOnce({ stdout: '', stderr: '' })

      await isDeviceInArpTable('192.168.1.100')

      expect(mockExecAsync).toHaveBeenCalledWith('arp -n 192.168.1.100')
    })

    it('should use "arp -n" on Unix-like systems (linux)', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true
      })
      mockExecAsync.mockResolvedValueOnce({ stdout: '', stderr: '' })

      await isDeviceInArpTable('192.168.1.100')

      expect(mockExecAsync).toHaveBeenCalledWith('arp -n 192.168.1.100')
    })
  })

  describe('MAC address detection', () => {
    it('should return true when ARP table contains MAC address with colons', async () => {
      const arpOutput = `
? (192.168.1.100) at aa:bb:cc:dd:ee:ff on en0 ifscope [ethernet]
`
      mockExecAsync.mockResolvedValueOnce({ stdout: arpOutput, stderr: '' })

      const result = await isDeviceInArpTable('192.168.1.100')

      expect(result).toBe(true)
    })

    it('should return true when ARP table contains MAC address with hyphens', async () => {
      const arpOutput = `
Interface: 192.168.1.1 --- 0x2
  Internet Address      Physical Address      Type
  192.168.1.100         aa-bb-cc-dd-ee-ff     dynamic
`
      mockExecAsync.mockResolvedValueOnce({ stdout: arpOutput, stderr: '' })

      const result = await isDeviceInArpTable('192.168.1.100')

      expect(result).toBe(true)
    })

    it('should return true with uppercase MAC address', async () => {
      const arpOutput = `
? (192.168.1.100) at AA:BB:CC:DD:EE:FF on en0 ifscope [ethernet]
`
      mockExecAsync.mockResolvedValueOnce({ stdout: arpOutput, stderr: '' })

      const result = await isDeviceInArpTable('192.168.1.100')

      expect(result).toBe(true)
    })

    it('should return true with mixed case MAC address', async () => {
      const arpOutput = `
? (192.168.1.100) at Aa:Bb:Cc:Dd:Ee:Ff on en0 ifscope [ethernet]
`
      mockExecAsync.mockResolvedValueOnce({ stdout: arpOutput, stderr: '' })

      const result = await isDeviceInArpTable('192.168.1.100')

      expect(result).toBe(true)
    })

    it('should return true with single digit hex values in MAC', async () => {
      const arpOutput = `
? (192.168.1.100) at a:b:c:d:e:f on en0 ifscope [ethernet]
`
      mockExecAsync.mockResolvedValueOnce({ stdout: arpOutput, stderr: '' })

      const result = await isDeviceInArpTable('192.168.1.100')

      expect(result).toBe(true)
    })

    it('should return false when ARP entry is incomplete', async () => {
      const arpOutput = `
? (192.168.1.100) at (incomplete) on en0 ifscope [ethernet]
`
      mockExecAsync.mockResolvedValueOnce({ stdout: arpOutput, stderr: '' })

      const result = await isDeviceInArpTable('192.168.1.100')

      expect(result).toBe(false)
    })

    it('should return false when ARP output is empty', async () => {
      mockExecAsync.mockResolvedValueOnce({ stdout: '', stderr: '' })

      const result = await isDeviceInArpTable('192.168.1.100')

      expect(result).toBe(false)
    })

    it('should return false when no MAC address found', async () => {
      const arpOutput = `
? (192.168.1.100) at <no entry> on en0
`
      mockExecAsync.mockResolvedValueOnce({ stdout: arpOutput, stderr: '' })

      const result = await isDeviceInArpTable('192.168.1.100')

      expect(result).toBe(false)
    })

    it('should return false when MAC address format is invalid', async () => {
      const arpOutput = `
? (192.168.1.100) at xx:yy:zz:aa:bb:cc on en0
`
      mockExecAsync.mockResolvedValueOnce({ stdout: arpOutput, stderr: '' })

      const result = await isDeviceInArpTable('192.168.1.100')

      expect(result).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should throw error when execAsync fails', async () => {
      const error = new Error('Command failed')
      mockExecAsync.mockRejectedValueOnce(error)

      await expect(isDeviceInArpTable('192.168.1.100')).rejects.toThrow('Command failed')
    })

    it('should handle network errors', async () => {
      const error = new Error('Network unreachable')
      mockExecAsync.mockRejectedValueOnce(error)

      await expect(isDeviceInArpTable('192.168.1.100')).rejects.toThrow('Network unreachable')
    })
  })

  describe('IP address variations', () => {
    it('should handle different IP addresses correctly', async () => {
      const arpOutput = `
? (10.0.0.5) at 11:22:33:44:55:66 on en0
`
      mockExecAsync.mockResolvedValueOnce({ stdout: arpOutput, stderr: '' })

      const result = await isDeviceInArpTable('10.0.0.5')

      expect(result).toBe(true)
      expect(mockExecAsync).toHaveBeenCalledWith(expect.stringContaining('10.0.0.5'))
    })

    it('should handle localhost IP', async () => {
      const arpOutput = `
? (127.0.0.1) at 00:00:00:00:00:00 on lo0
`
      mockExecAsync.mockResolvedValueOnce({ stdout: arpOutput, stderr: '' })

      const result = await isDeviceInArpTable('127.0.0.1')

      expect(result).toBe(true)
    })
  })

  describe('real-world ARP output examples', () => {
    it('should parse macOS/Darwin ARP output', async () => {
      const arpOutput = `
? (192.168.1.100) at a8:5e:45:c3:f2:1d on en0 ifscope [ethernet]
`
      mockExecAsync.mockResolvedValueOnce({ stdout: arpOutput, stderr: '' })

      const result = await isDeviceInArpTable('192.168.1.100')

      expect(result).toBe(true)
    })

    it('should parse Linux ARP output', async () => {
      const arpOutput = `
Address                  HWtype  HWaddress           Flags Mask            Iface
192.168.1.100            ether   a8:5e:45:c3:f2:1d   C                     eth0
`
      mockExecAsync.mockResolvedValueOnce({ stdout: arpOutput, stderr: '' })

      const result = await isDeviceInArpTable('192.168.1.100')

      expect(result).toBe(true)
    })

    it('should parse Windows ARP output', async () => {
      const arpOutput = `
Interface: 192.168.1.1 --- 0x2
  Internet Address      Physical Address      Type
  192.168.1.100         a8-5e-45-c3-f2-1d     dynamic
`
      mockExecAsync.mockResolvedValueOnce({ stdout: arpOutput, stderr: '' })

      const result = await isDeviceInArpTable('192.168.1.100')

      expect(result).toBe(true)
    })

    it('should handle Linux incomplete entry', async () => {
      const arpOutput = `
Address                  HWtype  HWaddress           Flags Mask            Iface
192.168.1.100                    (incomplete)                              eth0
`
      mockExecAsync.mockResolvedValueOnce({ stdout: arpOutput, stderr: '' })

      const result = await isDeviceInArpTable('192.168.1.100')

      expect(result).toBe(false)
    })
  })
})
