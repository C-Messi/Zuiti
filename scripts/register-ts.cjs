const fs = require('fs')
const esbuild = require('esbuild')

require.extensions['.ts'] = function registerTypeScript(module, filename) {
  const source = fs.readFileSync(filename, 'utf8')
  const output = esbuild.transformSync(source, {
    format: 'cjs',
    platform: 'node',
    target: 'node20',
    loader: 'ts',
    sourcemap: 'inline'
  })
  module._compile(output.code, filename)
}
