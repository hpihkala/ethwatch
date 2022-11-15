require('dotenv').config()
const express = require('express')
const app = express()

const blockExplorers = require('./blockExplorers')

app.use(express.json({
	limit: '1kb',
}))

function sendJsonResponse(res, status, response) {
	res.set('content-type', 'application/json')
	res.status(status)
	res.send(response)
}

function sendJsonError(res, status, message) {
	const errorMessage = {
		error: {
			message,
		},
	}
	sendJsonResponse(res, status, errorMessage)
}

app.post('/:chain/:address', async (req, res, next) => {
	if (!blockExplorers[req.params.chain]) {
		sendJsonError(res, 404, `Unsupported chain: ${req.params.chain}`)
	}
	try {
		const existingValue = await redis.get(redisKey)

		if (!existingValue) {
			const abiString = await blockExplorers[req.params.chain](req.params.address)
			const abi = JSON.parse(abiString)
			const events = abi.filter(item => item.type === 'event')
			
			const redisValue = JSON.stringify(events)
			await redis.set(redisKey, redisValue)
			console.log(`${redisKey}: ${redisValue}`)

			sendJsonResponse(res, 200, {
				chain: req.params.chain,
				address: req.params.address.toLowerCase(),
				eventsAbi: events,
			})
		} else {
			sendJsonResponse(res, 200, {
				chain: req.params.chain,
				address: req.params.address.toLowerCase(),
				eventsAbi: JSON.parse(existingValue),
			})
		}
	} catch (err) {
		sendJsonError(res, 404, `Couldn't get ABI: contract source is not verified on block explorer!`)
	}
})

redis.connect().then(() => {
	console.log(`Connected to redis`)
	app.listen(process.env.HTTP_PORT, () => {
		console.log(`HTTP server listening on port ${process.env.HTTP_PORT}`)
	})
})
