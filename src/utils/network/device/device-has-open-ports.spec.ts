import { deviceHasOpenPorts } from './device-has-open-ports'

const mockCheckPort = jest.fn()

jest.mock('../../utils/get-port-status.ts', () => ({
  getPortStatus: (...args: any[]) => mockCheckPort(...args)
}))

describe('deviceHasOpenPorts', () => {

  beforeEach(() => {
    jest.clearAllMocks()
    // Set default behavior - return 'closed' for any call not explicitly mocked
    mockCheckPort.mockResolvedValue('closed')
  })

  describe('when device has open ports', () => {
    it('should return true when first port in batch is open', async () => {
      mockCheckPort.mockResolvedValueOnce('open')

      const result = await deviceHasOpenPorts('192.168.1.100', [80, 443, 8080], 2000)

      expect(result).toBe(true)
      expect(mockCheckPort).toHaveBeenCalledWith('192.168.1.100', 80, 2000)
    })

    it('should return true when last port in batch is open', async () => {
      mockCheckPort
        .mockResolvedValueOnce('closed')
        .mockResolvedValueOnce('closed')
        .mockResolvedValueOnce('open')

      const result = await deviceHasOpenPorts('192.168.1.100', [80, 443, 8080], 2000)

      expect(result).toBe(true)
      expect(mockCheckPort).toHaveBeenCalledTimes(3)
    })

    it('should return true when middle port in batch is open', async () => {
      mockCheckPort
        .mockResolvedValueOnce('closed')
        .mockResolvedValueOnce('open')
        .mockResolvedValueOnce('closed')

      const result = await deviceHasOpenPorts('192.168.1.100', [80, 443, 8080], 2000)

      expect(result).toBe(true)
      expect(mockCheckPort).toHaveBeenCalledTimes(3)
    })

    it('should stop checking after finding first open port in first batch', async () => {
      mockCheckPort
        .mockResolvedValueOnce('closed')
        .mockResolvedValueOnce('open')  // Found in first batch
        .mockResolvedValueOnce('closed')
        .mockResolvedValueOnce('closed')
        .mockResolvedValueOnce('closed')
        .mockResolvedValueOnce('closed')

      const result = await deviceHasOpenPorts(
        '192.168.1.100',
        [21, 22, 80, 443, 3389, 8080], // 6 ports - would be 2 batches
        2000
      )

      expect(result).toBe(true)
      // Should not check the second batch (ports 3389, 8080)
      expect(mockCheckPort).toHaveBeenCalledTimes(5) // Only first batch
    })

    it('should check second batch if first batch has no open ports', async () => {
      // First batch (5 ports): all closed
      mockCheckPort
        .mockResolvedValueOnce('closed')
        .mockResolvedValueOnce('closed')
        .mockResolvedValueOnce('closed')
        .mockResolvedValueOnce('closed')
        .mockResolvedValueOnce('closed')
        // Second batch (2 ports): one open
        .mockResolvedValueOnce('open')
        .mockResolvedValueOnce('closed')

      const result = await deviceHasOpenPorts(
        '192.168.1.100',
        [21, 22, 23, 25, 53, 80, 443], // 7 ports - 2 batches
        2000
      )

      expect(result).toBe(true)
      expect(mockCheckPort).toHaveBeenCalledTimes(7) // All 5 from first batch + both from second batch (parallel)
    })
  })

  describe('when device has no open ports', () => {
    it('should return false when all ports are closed', async () => {
      // Uses default mockResolvedValue('closed') from beforeEach

      const result = await deviceHasOpenPorts('192.168.1.100', [80, 443, 8080], 2000)

      expect(result).toBe(false)
      expect(mockCheckPort).toHaveBeenCalledTimes(3)
    })

    it('should return false when all ports are unreachable', async () => {
      mockCheckPort.mockResolvedValue('unreachable')

      const result = await deviceHasOpenPorts('192.168.1.100', [80, 443], 2000)

      expect(result).toBe(false)
      expect(mockCheckPort).toHaveBeenCalledTimes(2)
    })

    it('should return false when ports are mix of closed and unreachable', async () => {
      mockCheckPort
        .mockResolvedValueOnce('closed')
        .mockResolvedValueOnce('unreachable')
        .mockResolvedValueOnce('closed')

      const result = await deviceHasOpenPorts('192.168.1.100', [80, 443, 8080], 2000)

      expect(result).toBe(false)
      expect(mockCheckPort).toHaveBeenCalledTimes(3)
    })

    it('should check all batches when no open ports found', async () => {
      // Uses default mockResolvedValue('closed') from beforeEach

      const result = await deviceHasOpenPorts(
        '192.168.1.100',
        [21, 22, 23, 25, 53, 80, 443, 8080, 3389, 5900], // 10 ports - 2 batches
        2000
      )

      expect(result).toBe(false)
      expect(mockCheckPort).toHaveBeenCalledTimes(10)
    })
  })

  describe('batching behavior', () => {
    it('should process ports in batches of 5', async () => {
      // Uses default mockResolvedValue('closed') from beforeEach

      await deviceHasOpenPorts(
        '192.168.1.100',
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        2000
      )

      // Should process in 2 batches: [1,2,3,4,5] then [6,7,8,9,10]
      expect(mockCheckPort).toHaveBeenCalledTimes(10)
    })

    it('should handle ports count not divisible by batch size', async () => {
      // Uses default mockResolvedValue('closed') from beforeEach

      await deviceHasOpenPorts(
        '192.168.1.100',
        [1, 2, 3, 4, 5, 6, 7], // 7 ports - 2 batches (5 + 2)
        2000
      )

      expect(mockCheckPort).toHaveBeenCalledTimes(7)
    })

    it('should handle single port', async () => {
      mockCheckPort.mockResolvedValueOnce('open')

      const result = await deviceHasOpenPorts('192.168.1.100', [80], 2000)

      expect(result).toBe(true)
      expect(mockCheckPort).toHaveBeenCalledTimes(1)
      expect(mockCheckPort).toHaveBeenCalledWith('192.168.1.100', 80, 2000)
    })

    it('should handle fewer ports than batch size', async () => {
      // Uses default mockResolvedValue('closed') from beforeEach

      await deviceHasOpenPorts('192.168.1.100', [80, 443, 8080], 2000)

      // Only 3 ports, less than batch size of 5
      expect(mockCheckPort).toHaveBeenCalledTimes(3)
    })
  })

  describe('error handling', () => {
    it('should treat checkPort errors as closed ports', async () => {
      mockCheckPort
        .mockRejectedValueOnce(new Error('Connection error'))
        .mockResolvedValueOnce('open')

      const result = await deviceHasOpenPorts('192.168.1.100', [80, 443], 2000)

      expect(result).toBe(true)
      expect(mockCheckPort).toHaveBeenCalledTimes(2)
    })

    it('should continue checking after errors', async () => {
      mockCheckPort
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce('closed')

      const result = await deviceHasOpenPorts('192.168.1.100', [80, 443, 8080], 2000)

      expect(result).toBe(false)
      expect(mockCheckPort).toHaveBeenCalledTimes(3)
    })

    it('should return false when all checks error', async () => {
      mockCheckPort.mockRejectedValue(new Error('Network error'))

      const result = await deviceHasOpenPorts('192.168.1.100', [80, 443], 2000)

      expect(result).toBe(false)
      expect(mockCheckPort).toHaveBeenCalledTimes(2)
    })
  })

  describe('parameter passing', () => {
    it('should pass correct ip, port, and timeout to checkPort', async () => {
      mockCheckPort.mockResolvedValueOnce('open')

      await deviceHasOpenPorts('10.0.0.5', [8080], 5000)

      expect(mockCheckPort).toHaveBeenCalledWith('10.0.0.5', 8080, 5000)
    })

    it('should pass all ports in sequence across batches', async () => {
      // Uses default mockResolvedValue('closed') from beforeEach

      await deviceHasOpenPorts(
        '192.168.1.1',
        [21, 22, 23, 80, 443, 8080],
        3000
      )

      expect(mockCheckPort).toHaveBeenNthCalledWith(1, '192.168.1.1', 21, 3000)
      expect(mockCheckPort).toHaveBeenNthCalledWith(2, '192.168.1.1', 22, 3000)
      expect(mockCheckPort).toHaveBeenNthCalledWith(3, '192.168.1.1', 23, 3000)
      expect(mockCheckPort).toHaveBeenNthCalledWith(4, '192.168.1.1', 80, 3000)
      expect(mockCheckPort).toHaveBeenNthCalledWith(5, '192.168.1.1', 443, 3000)
      expect(mockCheckPort).toHaveBeenNthCalledWith(6, '192.168.1.1', 8080, 3000)
    })
  })
})