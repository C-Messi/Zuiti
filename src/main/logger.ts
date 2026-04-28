type StreamError = Error & { code?: string }

type LogWriter = (line: string) => void

function formatArg(arg: unknown): string {
  if (arg instanceof Error) return `${arg.name}: ${arg.message}`
  if (typeof arg === 'string') return arg
  try {
    return JSON.stringify(arg)
  } catch {
    return String(arg)
  }
}

function ignoreBrokenPipe(err: unknown): void {
  const code = (err as StreamError | undefined)?.code
  if (code === 'EPIPE' || code === 'ERR_STREAM_DESTROYED') return
}

export function setupSafeProcessLogging(): void {
  process.stdout.on('error', ignoreBrokenPipe)
  process.stderr.on('error', ignoreBrokenPipe)
}

export function writeSafeLog(writer: LogWriter, args: unknown[]): void {
  try {
    writer(`${args.map(formatArg).join(' ')}\n`)
  } catch {
    /* Logging must never crash the pet. */
  }
}

export function safeWarn(...args: unknown[]): void {
  writeSafeLog((line) => process.stderr.write(line), args)
}
