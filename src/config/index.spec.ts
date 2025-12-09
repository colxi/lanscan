import { initConfig, getConfig } from './index';
import { ScanConfig } from './types';
import { CommonPorts } from '../constants';
import { defaultConfig } from './config.default';

describe('config/index', () => {
  describe('initConfig and getConfig', () => {
    it('should initialize and retrieve config from args mode', () => {
      const args = {
        _: [],
        '--ip': '192.168.1.0/24',
        '--ports': '80,443',
        '--timeout': 3000,
        '--concurrency': 75,
        '--identify': true,
        '--verbose': false,
      };

      initConfig({
        mode: 'args',
        data: args,
      });

      const config = getConfig();
      expect(config).toBeDefined();
      expect(config.startIp).toBe('192.168.1.1');
      expect(config.endIp).toBe('192.168.1.254');
      expect(config.ports).toEqual([80, 443]);
      expect(config.timeout).toBe(3000);
      expect(config.concurrency).toBe(75);
      expect(config.identify).toBe(true);
      expect(config.verbose).toBe(false);
    });

    it('should initialize and retrieve config from object mode', () => {
      const configData: ScanConfig = {
        startIp: '10.0.0.1',
        endIp: '10.0.0.255',
        ports: [22, 80, 443],
        timeout: 5000,
        concurrency: 25,
        identify: false,
        verbose: true,
      };

      initConfig({
        mode: 'object',
        data: configData,
      });

      const config = getConfig();
      expect(config).toBeDefined();
      expect(config.startIp).toBe('10.0.0.1');
      expect(config.endIp).toBe('10.0.0.255');
      expect(config.ports).toEqual([22, 80, 443]);
      expect(config.timeout).toBe(5000);
      expect(config.concurrency).toBe(25);
      expect(config.identify).toBe(false);
      expect(config.verbose).toBe(true);
    });

    it('should handle port groups in args mode', () => {
      const args = {
        _: [],
        '--ports': 'Web',
      };

      initConfig({
        mode: 'args',
        data: args,
      });

      const config = getConfig();
      expect(config.ports).toEqual(CommonPorts.Web);
    });

    it('should use defaults when args are not provided', () => {
      const args = {
        _: [],
      };

      initConfig({
        mode: 'args',
        data: args,
      });

      const config = getConfig();
      expect(config.startIp).toBe(defaultConfig.startIp);
      expect(config.endIp).toBe(defaultConfig.endIp);
      expect(config.ports).toEqual(defaultConfig.ports);
      expect(config.timeout).toBe(defaultConfig.timeout);
      expect(config.concurrency).toBe(defaultConfig.concurrency);
      expect(config.identify).toBe(defaultConfig.identify);
      expect(config.verbose).toBe(defaultConfig.verbose);
    });

    it('should merge partial config with defaults in object mode', () => {
      const partial: Partial<ScanConfig> = {
        ports: [8080],
        timeout: 3000,
      };

      initConfig({
        mode: 'object',
        data: partial,
      });

      const config = getConfig();
      // Overridden values
      expect(config.ports).toEqual([8080]);
      expect(config.timeout).toBe(3000);
      // Values from defaults
      expect(config.startIp).toBe(defaultConfig.startIp);
      expect(config.endIp).toBe(defaultConfig.endIp);
      expect(config.concurrency).toBe(defaultConfig.concurrency);
      expect(config.identify).toBe(defaultConfig.identify);
      expect(config.verbose).toBe(defaultConfig.verbose);
    });

    it('should return same config instance on multiple calls', () => {
      const configData: ScanConfig = {
        startIp: '192.168.1.1',
        endIp: '192.168.1.254',
        ports: [80],
        timeout: 2000,
        concurrency: 50,
        identify: false,
        verbose: false,
      };

      initConfig({
        mode: 'object',
        data: configData,
      });

      const config1 = getConfig();
      const config2 = getConfig();
      
      expect(config1).toBe(config2);
    });

    it('should allow re-initialization with new config', () => {
      // First initialization
      initConfig({
        mode: 'object',
        data: {
          startIp: '192.168.1.1',
          endIp: '192.168.1.254',
          ports: [80],
          timeout: 2000,
          concurrency: 50,
          identify: false,
          verbose: false,
        },
      });

      let config = getConfig();
      expect(config.ports).toEqual([80]);

      // Second initialization (overwriting)
      initConfig({
        mode: 'object',
        data: {
          startIp: '10.0.0.1',
          endIp: '10.0.0.255',
          ports: [443],
          timeout: 3000,
          concurrency: 100,
          identify: true,
          verbose: true,
        },
      });

      config = getConfig();
      expect(config.ports).toEqual([443]);
      expect(config.startIp).toBe('10.0.0.1');
      expect(config.identify).toBe(true);
    });

    it('should throw when validating invalid config', () => {
      const invalidConfig = {
        startIp: 'invalid-ip',
        endIp: '192.168.1.254',
        ports: [80],
        timeout: 2000,
        concurrency: 50,
        identify: false,
        verbose: false,
      };

      expect(() => {
        initConfig({
          mode: 'object',
          data: invalidConfig as any,
        });
      }).toThrow();
    });

    it('should handle CIDR notation in args mode', () => {
      const args = {
        _: [],
        '--ip': '10.0.0.0/24',
        '--ports': '22',
      };

      initConfig({
        mode: 'args',
        data: args,
      });

      const config = getConfig();
      expect(config.startIp).toBe('10.0.0.1');
      expect(config.endIp).toBe('10.0.0.254');
    });

    it('should handle IP range in args mode', () => {
      const args = {
        _: [],
        '--ip': '192.168.1.10-192.168.1.20',
        '--ports': '80',
      };

      initConfig({
        mode: 'args',
        data: args,
      });

      const config = getConfig();
      expect(config.startIp).toBe('192.168.1.10');
      expect(config.endIp).toBe('192.168.1.20');
    });
  });
});
