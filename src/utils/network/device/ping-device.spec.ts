import { pingDevice } from '../ping-device'

const mockExecAsync = jest.fn()

jest.mock('child_process')

jest.mock('util', () => {
  const actualUtil = jest.requireActual('util')
  return {
    ...actualUtil,
    promisify: jest.fn((fn) => {
      if (fn === require('child_process').exec) {
        return mockExecAsync
      }
      return actualUtil.promisify(fn)
    })
  }
})


describe('pingDevice', () => {
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

  describe('platform-specific ping command', () => {
    it('should use Windows ping command on win32', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true
      })
      mockExecAsync.mockResolvedValueOnce({ stdout: 'Reply from 192.168.1.100', stderr: '' })

      const result = await pingDevice('192.168.1.100', 2000)

      expect(result).toBe(true)
      expect(mockExecAsync).toHaveBeenCalledWith(
        'ping -n 1 -w 2000 192.168.1.100',
        { timeout: 2500 }
      )
    })

    it('should use Unix ping command on darwin', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        configurable: true
      })
      mockExecAsync.mockResolvedValueOnce({ stdout: '1 packets transmitted, 1 received', stderr: '' })

      const result = await pingDevice('192.168.1.100', 2000)

      expect(result).toBe(true)
      expect(mockExecAsync).toHaveBeenCalledWith(
        'ping -c 1 -W 2 192.168.1.100',
        { timeout: 2500 }
      )
    })

    it('should use Unix ping command on linux', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true
      })
      mockExecAsync.mockResolvedValueOnce({ stdout: '1 packets transmitted, 1 received', stderr: '' })

      const result = await pingDevice('192.168.1.100', 2000)

      expect(result).toBe(true)
      expect(mockExecAsync).toHaveBeenCalledWith(
        'ping -c 1 -W 2 192.168.1.100',
        { timeout: 2500 }
      )
    })

    it('should round up timeout for Unix systems', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true
      })
      mockExecAsync.mockResolvedValueOnce({ stdout: '', stderr: '' })

      await pingDevice('192.168.1.100', 1500)

      // 1500ms / 1000 = 1.5, should round up to 2
      expect(mockExecAsync).toHaveBeenCalledWith(
        'ping -c 1 -W 2 192.168.1.100',
        { timeout: 2000 }
      )
    })

    it('should handle timeout of 1 second correctly', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true
      })
      mockExecAsync.mockResolvedValueOnce({ stdout: '', stderr: '' })

      await pingDevice('192.168.1.100', 1000)

      expect(mockExecAsync).toHaveBeenCalledWith(
        'ping -c 1 -W 1 192.168.1.100',
        { timeout: 1500 }
      )
    })
  })

  describe('default timeout', () => {
    it('should use default timeout of 1000ms when not specified', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true
      })
      mockExecAsync.mockResolvedValueOnce({ stdout: '', stderr: '' })

      await pingDevice('192.168.1.100')

      expect(mockExecAsync).toHaveBeenCalledWith(
        'ping -c 1 -W 1 192.168.1.100',
        { timeout: 1500 }
      )
    })
  })

  describe('successful ping responses', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true
      })
    })

    it('should return true when ping succeeds', async () => {
      mockExecAsync.mockResolvedValueOnce({ 
        stdout: '1 packets transmitted, 1 received, 0% packet loss',
        stderr: '' 
      })

      const result = await pingDevice('192.168.1.100')

      expect(result).toBe(true)
    })

    it('should return true for different IP addresses', async () => {
      mockExecAsync.mockResolvedValueOnce({ stdout: 'success', stderr: '' })

      const result = await pingDevice('10.0.0.5')

      expect(result).toBe(true)
      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('10.0.0.5'),
        expect.any(Object)
      )
    })

    it('should return true for localhost', async () => {
      mockExecAsync.mockResolvedValueOnce({ stdout: 'success', stderr: '' })

      const result = await pingDevice('127.0.0.1')

      expect(result).toBe(true)
    })

    it('should return true with empty stdout but successful execution', async () => {
      mockExecAsync.mockResolvedValueOnce({ stdout: '', stderr: '' })

      const result = await pingDevice('192.168.1.100')

      expect(result).toBe(true)
    })
  })

  describe('failed ping responses', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true
      })
    })

    it('should return false when ping command fails', async () => {
      mockExecAsync.mockRejectedValueOnce(new Error('Host unreachable'))

      const result = await pingDevice('192.168.1.200')

      expect(result).toBe(false)
    })

    it('should return false on timeout', async () => {
      mockExecAsync.mockRejectedValueOnce(new Error('Timeout'))

      const result = await pingDevice('192.168.1.200', 1000)

      expect(result).toBe(false)
    })

    it('should return false when host is down', async () => {
      mockExecAsync.mockRejectedValueOnce(new Error('100% packet loss'))

      const result = await pingDevice('192.168.1.200')

      expect(result).toBe(false)
    })

    it('should return false on network unreachable', async () => {
      mockExecAsync.mockRejectedValueOnce(new Error('Network is unreachable'))

      const result = await pingDevice('192.168.1.200')

      expect(result).toBe(false)
    })

    it('should return false on unknown error', async () => {
      mockExecAsync.mockRejectedValueOnce(new Error('Unknown error'))

      const result = await pingDevice('192.168.1.200')

      expect(result).toBe(false)
    })
  })

  describe('timeout buffer', () => {
    it('should add 500ms buffer to execution timeout', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true
      })
      mockExecAsync.mockResolvedValueOnce({ stdout: '', stderr: '' })

      await pingDevice('192.168.1.100', 3000)

      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.any(String),
        { timeout: 3500 }
      )
    })

    it('should add buffer for Windows as well', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true
      })
      mockExecAsync.mockResolvedValueOnce({ stdout: '', stderr: '' })

      await pingDevice('192.168.1.100', 2000)

      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.any(String),
        { timeout: 2500 }
      )
    })
  })

  describe('real-world scenarios', () => {
    it('should handle typical macOS ping success output', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        configurable: true
      })
      const macOSOutput = `PING 192.168.1.100 (192.168.1.100): 56 data bytes
64 bytes from 192.168.1.100: icmp_seq=0 ttl=64 time=0.045 ms

--- 192.168.1.100 ping statistics ---
1 packets transmitted, 1 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 0.045/0.045/0.045/0.000 ms`
      
      mockExecAsync.mockResolvedValueOnce({ stdout: macOSOutput, stderr: '' })

      const result = await pingDevice('192.168.1.100')

      expect(result).toBe(true)
    })

    it('should handle typical Linux ping success output', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true
      })
      const linuxOutput = `PING 192.168.1.100 (192.168.1.100) 56(84) bytes of data.
64 bytes from 192.168.1.100: icmp_seq=1 ttl=64 time=0.045 ms

--- 192.168.1.100 ping statistics ---
1 packets transmitted, 1 received, 0% packet loss, time 0ms
rtt min/avg/max/mdev = 0.045/0.045/0.045/0.000 ms`
      
      mockExecAsync.mockResolvedValueOnce({ stdout: linuxOutput, stderr: '' })

      const result = await pingDevice('192.168.1.100')

      expect(result).toBe(true)
    })

    it('should handle typical Windows ping success output', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true
      })
      const windowsOutput = `
Pinging 192.168.1.100 with 32 bytes of data:
Reply from 192.168.1.100: bytes=32 time<1ms TTL=64

Ping statistics for 192.168.1.100:
    Packets: Sent = 1, Received = 1, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 0ms, Maximum = 0ms, Average = 0ms`
      
      mockExecAsync.mockResolvedValueOnce({ stdout: windowsOutput, stderr: '' })

      const result = await pingDevice('192.168.1.100')

      expect(result).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle very short timeout', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true
      })
      mockExecAsync.mockResolvedValueOnce({ stdout: '', stderr: '' })

      await pingDevice('192.168.1.100', 100)

      expect(mockExecAsync).toHaveBeenCalledWith(
        'ping -c 1 -W 1 192.168.1.100',
        { timeout: 600 }
      )
    })

    it('should handle very long timeout', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true
      })
      mockExecAsync.mockResolvedValueOnce({ stdout: '', stderr: '' })

      await pingDevice('192.168.1.100', 10000)

      expect(mockExecAsync).toHaveBeenCalledWith(
        'ping -c 1 -W 10 192.168.1.100',
        { timeout: 10500 }
      )
    })

    it('should handle IPv4 address with leading zeros', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true
      })
      mockExecAsync.mockResolvedValueOnce({ stdout: '', stderr: '' })

      await pingDevice('192.168.001.100')

      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('192.168.001.100'),
        expect.any(Object)
      )
    })
  })
})

