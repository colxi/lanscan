import type { Result } from 'arg'

export type ParsedCommandLineArgs = Result<{
    '--help': BooleanConstructor;
    '--ip': StringConstructor;
    '--ports': StringConstructor;
    '--timeout': NumberConstructor;
    '--concurrency': NumberConstructor;
    '--identify': BooleanConstructor;
    '--verbose': BooleanConstructor;
    '-h': string;
    '-t': string;
    '-c': string;
    '-i': string;
    '-v': string;
}>
