const fetch = require('node-fetch')

class APIRateLimitError extends Error {
	constructor(msg) {
		super(msg)
	}
}

module.exports = {
	ethereum: async (address) => {
		const response = await fetch(`https://api.etherscan.io/api?module=contract&action=getabi&address=${address.toLowerCase()}&apikey=${process.env.ETHERSCAN_API_KEY}`)
		const data = await response.json()

		if (data.status == '1') {
			return data.result
		} else {
			if (data.result.includes('not verified')) {
				return null
			}
			if (data.result.includes('rate limit')) {
				throw new APIRateLimitError(`Rate limited: ${JSON.stringify(data)}`)
			}
			else {
				throw new Error(`Failed to fetch ABI: ${JSON.stringify(data)}`)
			}
		}
	},
	APIRateLimitError,
}
