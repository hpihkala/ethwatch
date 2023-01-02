/* eslint-disable @typescript-eslint/no-require-imports */
// CJS entrypoint.
const EthWatchExports = require('./exports')

Object.assign(EthWatchExports.EthWatch, EthWatchExports)

// required to get require('ethwatch-client') instead of require('ethwatch-client').default
module.exports = EthWatchExports.EthWatch
