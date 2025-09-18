class WebsocketServerConnector {
	constructor(options) {
		this.options = options || {}
	}

	async start() {
		return
	}

	async checkConnectivity(_allowSelfSignedCertificate) {
		return {
			host: this.options?.host ?? '127.0.0.1',
			natType: 0,
			ipAddress: 2130706433,
			protocolVersion: 1
		}
	}

	async autoCertify() { return }
	setLocalPeerDescriptor(_peerDescriptor) { return }
	isPossibleToFormConnection(_targetPeerDescriptor) { return false }
	connect(_targetPeerDescriptor) { throw new Error('WebsocketServerConnector is not available in the browser') }
	async destroy() { return }
}

module.exports = { WebsocketServerConnector }


