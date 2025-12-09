import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { getCommandLineArgs, displayCommandLineUsage } from './index';

let consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
let consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
let processExitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: unknown): never => {
  throw new Error(`process.exit called with ${code}`);
});

describe('cli/index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCommandLineArgs', () => {
    it('should parse no arguments', () => {
      process.argv = ['node', 'script.js'];
      
      const result = getCommandLineArgs();
      
      expect(result).toBeDefined();
      expect(result._).toEqual([]);
    });

    it('should parse --ip argument', () => {
      process.argv = ['node', 'script.js', '--ip=192.168.1.0/24'];
      
      const result = getCommandLineArgs();
      
      expect(result['--ip']).toBe('192.168.1.0/24');
    });

    it('should parse --ports argument', () => {
      process.argv = ['node', 'script.js', '--ports=80,443,22'];
      
      const result = getCommandLineArgs();
      
      expect(result['--ports']).toBe('80,443,22');
    });

    it('should parse --timeout argument', () => {
      process.argv = ['node', 'script.js', '--timeout=5000'];
      
      const result = getCommandLineArgs();
      
      expect(result['--timeout']).toBe(5000);
    });

    it('should parse --concurrency argument', () => {
      process.argv = ['node', 'script.js', '--concurrency=100'];
      
      const result = getCommandLineArgs();
      
      expect(result['--concurrency']).toBe(100);
    });

    it('should parse --identify flag', () => {
      process.argv = ['node', 'script.js', '--identify'];
      
      const result = getCommandLineArgs();
      
      expect(result['--identify']).toBe(true);
    });

    it('should parse --verbose flag', () => {
      process.argv = ['node', 'script.js', '--verbose'];
      
      const result = getCommandLineArgs();
      
      expect(result['--verbose']).toBe(true);
    });

    it('should parse --help flag', () => {
      process.argv = ['node', 'script.js', '--help'];
      
      const result = getCommandLineArgs();
      
      expect(result['--help']).toBe(true);
    });

    it('should parse -h alias for help', () => {
      process.argv = ['node', 'script.js', '-h'];
      
      const result = getCommandLineArgs();
      
      expect(result['--help']).toBe(true);
    });

    it('should parse -t alias for timeout', () => {
      process.argv = ['node', 'script.js', '-t', '3000'];
      
      const result = getCommandLineArgs();
      
      expect(result['--timeout']).toBe(3000);
    });

    it('should parse -c alias for concurrency', () => {
      process.argv = ['node', 'script.js', '-c', '75'];
      
      const result = getCommandLineArgs();
      
      expect(result['--concurrency']).toBe(75);
    });

    it('should parse -i alias for identify', () => {
      process.argv = ['node', 'script.js', '-i'];
      
      const result = getCommandLineArgs();
      
      expect(result['--identify']).toBe(true);
    });

    it('should parse -v alias for verbose', () => {
      process.argv = ['node', 'script.js', '-v'];
      
      const result = getCommandLineArgs();
      
      expect(result['--verbose']).toBe(true);
    });

    it('should parse multiple arguments together', () => {
      process.argv = [
        'node',
        'script.js',
        '--ip=10.0.0.0/24',
        '--ports=Web',
        '--timeout=3000',
        '--concurrency=50',
        '--identify',
        '--verbose'
      ];
      
      const result = getCommandLineArgs();
      
      expect(result['--ip']).toBe('10.0.0.0/24');
      expect(result['--ports']).toBe('Web');
      expect(result['--timeout']).toBe(3000);
      expect(result['--concurrency']).toBe(50);
      expect(result['--identify']).toBe(true);
      expect(result['--verbose']).toBe(true);
    });

    it('should parse mixed flags and aliases', () => {
      process.argv = [
        'node',
        'script.js',
        '--ip=192.168.1.1',
        '-t', '5000',
        '-i'
      ];
      
      const result = getCommandLineArgs();
      
      expect(result['--ip']).toBe('192.168.1.1');
      expect(result['--timeout']).toBe(5000);
      expect(result['--identify']).toBe(true);
    });

    it('should handle invalid arguments and exit', () => {
      process.argv = ['node', 'script.js', '--invalid-flag'];
      
      expect(() => {
        getCommandLineArgs();
      }).toThrow('process.exit called with 1');
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should not modify original arguments when no flags provided', () => {
      process.argv = ['node', 'script.js'];
      
      const result = getCommandLineArgs();
      
      expect(result['--ip']).toBeUndefined();
      expect(result['--ports']).toBeUndefined();
      expect(result['--timeout']).toBeUndefined();
      expect(result['--concurrency']).toBeUndefined();
      expect(result['--identify']).toBeUndefined();
      expect(result['--verbose']).toBeUndefined();
      expect(result['--help']).toBeUndefined();
    });
  });

  describe('displayCommandLineUsage', () => {
    it('should display usage information', () => {
      displayCommandLineUsage();
      
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls.length).toBeGreaterThan(0);
    });

    it('should display usage header', () => {
      displayCommandLineUsage();
      
      const calls = consoleLogSpy.mock.calls.map(call => call[0]);
      expect(calls).toContain('Usage: lanscan [options]');
    });

    it('should display optional arguments section', () => {
      displayCommandLineUsage();
      
      const calls = consoleLogSpy.mock.calls.map(call => call[0]);
      expect(calls).toContain('Optional Arguments:');
    });

    it('should display --ip option', () => {
      displayCommandLineUsage();
      
      const calls = consoleLogSpy.mock.calls.map(call => call[0]);
      const ipOption = calls.find(line => line.includes('--ip'));
      expect(ipOption).toBeDefined();
      expect(ipOption).toContain('IP address');
    });

    it('should display --ports option', () => {
      displayCommandLineUsage();
      
      const calls = consoleLogSpy.mock.calls.map(call => call[0]);
      const portsOption = calls.find(line => line.includes('--ports'));
      expect(portsOption).toBeDefined();
    });

    it('should display examples section', () => {
      displayCommandLineUsage();
      
      const calls = consoleLogSpy.mock.calls.map(call => call[0]);
      expect(calls).toContain('Examples:');
    });

    it('should display available port groups', () => {
      displayCommandLineUsage();
      
      const calls = consoleLogSpy.mock.calls.map(call => call[0]);
      expect(calls).toContain('Available port groups:');
    });

    it('should display options section', () => {
      displayCommandLineUsage();
      
      const calls = consoleLogSpy.mock.calls.map(call => call[0]);
      expect(calls).toContain('Options:');
    });

    it('should display help flag', () => {
      displayCommandLineUsage();
      
      const calls = consoleLogSpy.mock.calls.map(call => call[0]);
      const helpOption = calls.find(line => line.includes('-h, --help'));
      expect(helpOption).toBeDefined();
    });

    it('should display timeout flag', () => {
      displayCommandLineUsage();
      
      const calls = consoleLogSpy.mock.calls.map(call => call[0]);
      const timeoutOption = calls.find(line => line.includes('-t, --timeout'));
      expect(timeoutOption).toBeDefined();
    });

    it('should display concurrency flag', () => {
      displayCommandLineUsage();
      
      const calls = consoleLogSpy.mock.calls.map(call => call[0]);
      const concurrencyOption = calls.find(line => line.includes('-c, --concurrency'));
      expect(concurrencyOption).toBeDefined();
    });

    it('should display identify flag', () => {
      displayCommandLineUsage();
      
      const calls = consoleLogSpy.mock.calls.map(call => call[0]);
      const identifyOption = calls.find(line => line.includes('-i, --identify'));
      expect(identifyOption).toBeDefined();
    });

    it('should display verbose flag', () => {
      displayCommandLineUsage();
      
      const calls = consoleLogSpy.mock.calls.map(call => call[0]);
      const verboseOption = calls.find(line => line.includes('-v, --verbose'));
      expect(verboseOption).toBeDefined();
    });

    it('should display default values', () => {
      displayCommandLineUsage();
      
      const calls = consoleLogSpy.mock.calls.map(call => call[0]);
      const hasDefaults = calls.some(line => 
        line.includes('default:') || line.includes('192.168.1.1-254')
      );
      expect(hasDefaults).toBe(true);
    });

    it('should mention Common port group', () => {
      displayCommandLineUsage();
      
      const calls = consoleLogSpy.mock.calls.map(call => call[0]);
      const hasCommon = calls.some(line => line.includes('Common'));
      expect(hasCommon).toBe(true);
    });

    it('should not call console.error', () => {
      displayCommandLineUsage();
      
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('error handling integration', () => {
    it('should display usage when parsing fails', () => {
      process.argv = ['node', 'script.js', '--unknown'];
      
      expect(() => {
        getCommandLineArgs();
      }).toThrow('process.exit');
      
      // Should have displayed usage
      expect(consoleLogSpy).toHaveBeenCalled();
      const calls = consoleLogSpy.mock.calls.map(call => call[0]);
      expect(calls).toContain('Usage: lanscan [options]');
    });

    it('should log error message before showing usage', () => {
      process.argv = ['node', 'script.js', '--invalid'];
      
      expect(() => {
        getCommandLineArgs();
      }).toThrow('process.exit');
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalled();
      
      // Error should be logged before usage display
      const errorCallOrder = consoleErrorSpy.mock.invocationCallOrder[0];
      const logCallOrder = consoleLogSpy.mock.invocationCallOrder[0];
      expect(errorCallOrder).toBeLessThan(logCallOrder);
    });
  });
});

