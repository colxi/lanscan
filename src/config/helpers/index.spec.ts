import { getConfigFromObject, getConfigFromArgs, assertIsValidConfig } from './index';
import { ScanConfig } from '../types';
import { CommonPorts } from '../../constants';
import { ParsedCommandLineArgs } from '../../cli/types';
import { defaultConfig } from '../config.default'


describe('config/helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getConfigFromObject', () => {
    it('should return default config when passed empty object', () => {
      const result = getConfigFromObject({}, defaultConfig);
      expect(result).toEqual(defaultConfig);
    });

    it('should override specific properties', () => {
      const result = getConfigFromObject(
        { timeout: 5000, identify: true },
        defaultConfig
      );
      expect(result.timeout).toBe(5000);
      expect(result.identify).toBe(true);
      expect(result.concurrency).toBe(50); // unchanged
    });

    it('should override all properties', () => {
      const custom: ScanConfig = {
        timeout: 3000,
        concurrency: 100,
        identify: true,
        verbose: true,
        startIp: '10.0.0.1',
        endIp: '10.0.0.255',
        ports: [22, 80, 443],
      };
      const result = getConfigFromObject(custom, defaultConfig);
      expect(result).toEqual(custom);
    });

    it('should override ports array', () => {
      const result = getConfigFromObject(
        { ports: [8080, 3000] },
        defaultConfig
      );
      expect(result.ports).toEqual([8080, 3000]);
    });
  });

  describe('getConfigFromArgs', () => {
    it('should use default config when no args provided', () => {
      const args: ParsedCommandLineArgs = { _: [] };
      const result = getConfigFromArgs(args, defaultConfig);
      
      expect(result.startIp).toBe(defaultConfig.startIp);
      expect(result.endIp).toBe(defaultConfig.endIp);
      expect(result.timeout).toBe(defaultConfig.timeout);
      expect(result.concurrency).toBe(defaultConfig.concurrency);
      expect(result.identify).toBe(defaultConfig.identify);
      expect(result.verbose).toBe(defaultConfig.verbose);
    });

    it('should parse single IP address', () => {
      const args: ParsedCommandLineArgs = {
        _: [],
        '--ip': '192.168.1.100',
      };
      const result = getConfigFromArgs(args, defaultConfig);
      
      expect(result.startIp).toBe('192.168.1.100');
      expect(result.endIp).toBe('192.168.1.100');
    });

    it('should parse IP range', () => {
      const args: ParsedCommandLineArgs = {
        _: [],
        '--ip': '192.168.1.1-192.168.1.50',
      };
      const result = getConfigFromArgs(args, defaultConfig);
      
      expect(result.startIp).toBe('192.168.1.1');
      expect(result.endIp).toBe('192.168.1.50');
    });

    it('should parse CIDR notation', () => {
      const args: ParsedCommandLineArgs = {
        _: [],
        '--ip': '192.168.1.0/24',
      };
      const result = getConfigFromArgs(args, defaultConfig);
      
      expect(result.startIp).toBe('192.168.1.1');
      expect(result.endIp).toBe('192.168.1.254');
    });

    it('should parse comma-separated ports', () => {
      const args: ParsedCommandLineArgs = {
        _: [],
        '--ports': '80,443,8080',
      };
      const result = getConfigFromArgs(args, defaultConfig);
      
      expect(result.ports).toEqual([80, 443, 8080]);
    });

    it('should parse port group', () => {
      const args: ParsedCommandLineArgs = {
        _: [],
        '--ports': 'Web',
      };
      const result = getConfigFromArgs(args, defaultConfig);
      
      expect(result.ports).toEqual(CommonPorts.Web);
    });

    it('should handle timeout argument', () => {
      const args: ParsedCommandLineArgs = {
        _: [],
        '--timeout': 5000,
      };
      const result = getConfigFromArgs(args, defaultConfig);
      
      expect(result.timeout).toBe(5000);
    });

    it('should handle concurrency argument', () => {
      const args: ParsedCommandLineArgs = {
        _: [],
        '--concurrency': 100,
      };
      const result = getConfigFromArgs(args, defaultConfig);
      
      expect(result.concurrency).toBe(100);
    });

    it('should handle identify flag', () => {
      const args: ParsedCommandLineArgs = {
        _: [],
        '--identify': true,
      };
      const result = getConfigFromArgs(args, defaultConfig);
      
      expect(result.identify).toBe(true);
    });

    it('should handle verbose flag', () => {
      const args: ParsedCommandLineArgs = {
        _: [],
        '--verbose': true,
      };
      const result = getConfigFromArgs(args, defaultConfig);
      
      expect(result.verbose).toBe(true);
    });

    it('should handle all arguments together', () => {
      const args: ParsedCommandLineArgs = {
        _: [],
        '--ip': '10.0.0.0/24',
        '--ports': 'Common',
        '--timeout': 3000,
        '--concurrency': 75,
        '--identify': true,
        '--verbose': true,
      };
      const result = getConfigFromArgs(args, defaultConfig);
      
      expect(result.startIp).toBe('10.0.0.1');
      expect(result.endIp).toBe('10.0.0.254');
      expect(result.ports).toEqual(CommonPorts.Common);
      expect(result.timeout).toBe(3000);
      expect(result.concurrency).toBe(75);
      expect(result.identify).toBe(true);
      expect(result.verbose).toBe(true);
    });

    it('should trim whitespace from port values', () => {
      const args: ParsedCommandLineArgs = {
        _: [],
        '--ports': ' 80 , 443 , 8080 ',
      };
      const result = getConfigFromArgs(args, defaultConfig);
      
      expect(result.ports).toEqual([80, 443, 8080]);
    });
  });

  describe('assertIsValidConfig', () => {
    it('should accept valid config', () => {
      const validConfig: ScanConfig = {
        startIp: '192.168.1.1',
        endIp: '192.168.1.254',
        ports: [80, 443],
        timeout: 2000,
        concurrency: 50,
        identify: false,
        verbose: false,
      };

      expect(() => assertIsValidConfig(validConfig)).not.toThrow();
    });

    it('should throw if config is not an object', () => {
      expect(() => assertIsValidConfig(null)).toThrow('Configuration must be an object');
      expect(() => assertIsValidConfig(undefined)).toThrow('Configuration must be an object');
      expect(() => assertIsValidConfig('string')).toThrow('Configuration must be an object');
      expect(() => assertIsValidConfig(123)).toThrow('Configuration must be an object');
    });

    describe('startIp validation', () => {
      it('should throw if startIp is missing', () => {
        const config = {
          endIp: '192.168.1.254',
          ports: [80],
          timeout: 2000,
          concurrency: 50,
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).toThrow('startIp must be a string');
      });

      it('should throw if startIp is not a string', () => {
        const config = {
          startIp: 123,
          endIp: '192.168.1.254',
          ports: [80],
          timeout: 2000,
          concurrency: 50,
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).toThrow('startIp must be a string');
      });

      it('should throw if startIp is invalid IP format', () => {
        const config = {
          startIp: '999.999.999.999',
          endIp: '192.168.1.254',
          ports: [80],
          timeout: 2000,
          concurrency: 50,
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).toThrow('Invalid startIp: 999.999.999.999');
      });

      it('should throw if startIp has invalid format', () => {
        const config = {
          startIp: 'not-an-ip',
          endIp: '192.168.1.254',
          ports: [80],
          timeout: 2000,
          concurrency: 50,
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).toThrow('Invalid startIp: not-an-ip');
      });
    });

    describe('endIp validation', () => {
      it('should throw if endIp is missing', () => {
        const config = {
          startIp: '192.168.1.1',
          ports: [80],
          timeout: 2000,
          concurrency: 50,
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).toThrow('endIp must be a string');
      });

      it('should throw if endIp is not a string', () => {
        const config = {
          startIp: '192.168.1.1',
          endIp: 123,
          ports: [80],
          timeout: 2000,
          concurrency: 50,
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).toThrow('endIp must be a string');
      });

      it('should throw if endIp is invalid IP format', () => {
        const config = {
          startIp: '192.168.1.1',
          endIp: '300.300.300.300',
          ports: [80],
          timeout: 2000,
          concurrency: 50,
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).toThrow('Invalid endIp: 300.300.300.300');
      });
    });

    describe('IP range order validation', () => {
      it('should throw if startIp is greater than endIp', () => {
        const config = {
          startIp: '192.168.1.254',
          endIp: '192.168.1.1',
          ports: [80],
          timeout: 2000,
          concurrency: 50,
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).toThrow('startIp must be less than or equal to endIp');
      });

      it('should accept when startIp equals endIp', () => {
        const config = {
          startIp: '192.168.1.100',
          endIp: '192.168.1.100',
          ports: [80],
          timeout: 2000,
          concurrency: 50,
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).not.toThrow();
      });
    });

    describe('ports validation', () => {
      it('should throw if ports is missing', () => {
        const config = {
          startIp: '192.168.1.1',
          endIp: '192.168.1.254',
          timeout: 2000,
          concurrency: 50,
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).toThrow('At least one port must be specified');
      });

      it('should throw if ports is not an array', () => {
        const config = {
          startIp: '192.168.1.1',
          endIp: '192.168.1.254',
          ports: 'not-an-array',
          timeout: 2000,
          concurrency: 50,
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).toThrow('At least one port must be specified');
      });

      it('should throw if ports is empty array', () => {
        const config = {
          startIp: '192.168.1.1',
          endIp: '192.168.1.254',
          ports: [],
          timeout: 2000,
          concurrency: 50,
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).toThrow('At least one port must be specified');
      });

      it('should throw if port is not a number', () => {
        const config = {
          startIp: '192.168.1.1',
          endIp: '192.168.1.254',
          ports: [80, 'not-a-number', 443],
          timeout: 2000,
          concurrency: 50,
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).toThrow('Invalid port number(s). Ports must be between 1 and 65535');
      });

      it('should throw if port is less than 1', () => {
        const config = {
          startIp: '192.168.1.1',
          endIp: '192.168.1.254',
          ports: [0, 80],
          timeout: 2000,
          concurrency: 50,
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).toThrow('Invalid port number(s). Ports must be between 1 and 65535');
      });

      it('should throw if port is greater than 65535', () => {
        const config = {
          startIp: '192.168.1.1',
          endIp: '192.168.1.254',
          ports: [80, 65536],
          timeout: 2000,
          concurrency: 50,
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).toThrow('Invalid port number(s). Ports must be between 1 and 65535');
      });

      it('should throw if port is NaN', () => {
        const config = {
          startIp: '192.168.1.1',
          endIp: '192.168.1.254',
          ports: [80, NaN],
          timeout: 2000,
          concurrency: 50,
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).toThrow('Invalid port number(s). Ports must be between 1 and 65535');
      });

      it('should accept valid port range', () => {
        const config = {
          startIp: '192.168.1.1',
          endIp: '192.168.1.254',
          ports: [1, 80, 443, 8080, 65535],
          timeout: 2000,
          concurrency: 50,
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).not.toThrow();
      });
    });

    describe('timeout validation', () => {
      it('should throw if timeout is missing', () => {
        const config = {
          startIp: '192.168.1.1',
          endIp: '192.168.1.254',
          ports: [80],
          concurrency: 50,
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).toThrow('Timeout must be a positive number');
      });

      it('should throw if timeout is not a number', () => {
        const config = {
          startIp: '192.168.1.1',
          endIp: '192.168.1.254',
          ports: [80],
          timeout: '2000',
          concurrency: 50,
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).toThrow('Timeout must be a positive number');
      });

      it('should throw if timeout is zero', () => {
        const config = {
          startIp: '192.168.1.1',
          endIp: '192.168.1.254',
          ports: [80],
          timeout: 0,
          concurrency: 50,
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).toThrow('Timeout must be a positive number');
      });

      it('should throw if timeout is negative', () => {
        const config = {
          startIp: '192.168.1.1',
          endIp: '192.168.1.254',
          ports: [80],
          timeout: -1000,
          concurrency: 50,
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).toThrow('Timeout must be a positive number');
      });

      it('should throw if timeout is NaN', () => {
        const config = {
          startIp: '192.168.1.1',
          endIp: '192.168.1.254',
          ports: [80],
          timeout: NaN,
          concurrency: 50,
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).toThrow('Timeout must be a positive number');
      });
    });

    describe('concurrency validation', () => {
      it('should throw if concurrency is missing', () => {
        const config = {
          startIp: '192.168.1.1',
          endIp: '192.168.1.254',
          ports: [80],
          timeout: 2000,
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).toThrow('Concurrency must be a positive number');
      });

      it('should throw if concurrency is not a number', () => {
        const config = {
          startIp: '192.168.1.1',
          endIp: '192.168.1.254',
          ports: [80],
          timeout: 2000,
          concurrency: '50',
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).toThrow('Concurrency must be a positive number');
      });

      it('should throw if concurrency is zero', () => {
        const config = {
          startIp: '192.168.1.1',
          endIp: '192.168.1.254',
          ports: [80],
          timeout: 2000,
          concurrency: 0,
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).toThrow('Concurrency must be a positive number');
      });

      it('should throw if concurrency is negative', () => {
        const config = {
          startIp: '192.168.1.1',
          endIp: '192.168.1.254',
          ports: [80],
          timeout: 2000,
          concurrency: -10,
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).toThrow('Concurrency must be a positive number');
      });

      it('should throw if concurrency is NaN', () => {
        const config = {
          startIp: '192.168.1.1',
          endIp: '192.168.1.254',
          ports: [80],
          timeout: 2000,
          concurrency: NaN,
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).toThrow('Concurrency must be a positive number');
      });
    });

    describe('identify validation', () => {
      it('should throw if identify is missing', () => {
        const config = {
          startIp: '192.168.1.1',
          endIp: '192.168.1.254',
          ports: [80],
          timeout: 2000,
          concurrency: 50,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).toThrow('Identify must be a boolean');
      });

      it('should throw if identify is not a boolean', () => {
        const config = {
          startIp: '192.168.1.1',
          endIp: '192.168.1.254',
          ports: [80],
          timeout: 2000,
          concurrency: 50,
          identify: 'true',
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).toThrow('Identify must be a boolean');
      });

      it('should accept false', () => {
        const config = {
          startIp: '192.168.1.1',
          endIp: '192.168.1.254',
          ports: [80],
          timeout: 2000,
          concurrency: 50,
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).not.toThrow();
      });

      it('should accept true', () => {
        const config = {
          startIp: '192.168.1.1',
          endIp: '192.168.1.254',
          ports: [80],
          timeout: 2000,
          concurrency: 50,
          identify: true,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).not.toThrow();
      });
    });

    describe('verbose validation', () => {
      it('should throw if verbose is missing', () => {
        const config = {
          startIp: '192.168.1.1',
          endIp: '192.168.1.254',
          ports: [80],
          timeout: 2000,
          concurrency: 50,
          identify: false,
        };
        expect(() => assertIsValidConfig(config)).toThrow('Verbose must be a boolean');
      });

      it('should throw if verbose is not a boolean', () => {
        const config = {
          startIp: '192.168.1.1',
          endIp: '192.168.1.254',
          ports: [80],
          timeout: 2000,
          concurrency: 50,
          identify: false,
          verbose: 1,
        };
        expect(() => assertIsValidConfig(config)).toThrow('Verbose must be a boolean');
      });

      it('should accept false', () => {
        const config = {
          startIp: '192.168.1.1',
          endIp: '192.168.1.254',
          ports: [80],
          timeout: 2000,
          concurrency: 50,
          identify: false,
          verbose: false,
        };
        expect(() => assertIsValidConfig(config)).not.toThrow();
      });

      it('should accept true', () => {
        const config = {
          startIp: '192.168.1.1',
          endIp: '192.168.1.254',
          ports: [80],
          timeout: 2000,
          concurrency: 50,
          identify: false,
          verbose: true,
        };
        expect(() => assertIsValidConfig(config)).not.toThrow();
      });
    });
  });
});
