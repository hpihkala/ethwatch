// ESM EntryPoint
import EthWatch from './index.js'
export * from './index.js'
// required to get import EthWatch from 'ethwatch-client' to work
export default EthWatch.default
// note this file is manually copied as-is into dist/src since we don't want tsc to compile it to commonjs
