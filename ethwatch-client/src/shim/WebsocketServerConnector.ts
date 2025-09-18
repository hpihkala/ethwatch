export class WebsocketServerConnector {
	private options: any

	constructor(options?: any) {
		this.options = options || {}
	}

	async start(): Promise<void> {
		return
	}

	async checkConnectivity(_allowSelfSignedCertificate?: boolean): Promise<any> {
		return {
			host: this.options?.host ?? '127.0.0.1',
			natType: 0,
			ipAddress: 2130706433,
			protocolVersion: 1
		}
	}

	async autoCertify(): Promise<void> {
		return
	}

	setLocalPeerDescriptor(_peerDescriptor: any): void {
		return
	}

	isPossibleToFormConnection(_targetPeerDescriptor: any): boolean {
		return false
	}

	connect(_targetPeerDescriptor: any): any {
		throw new Error('WebsocketServerConnector is not available in the browser')
	}

	async destroy(): Promise<void> {
		return
	}
}

export default WebsocketServerConnector


