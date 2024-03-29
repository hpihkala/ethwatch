import { StreamrClient, StreamPermission, PermissionAssignment, UserPermissionAssignment } from 'streamr-client'

const privateKey = process.env.PRIVATE_KEY
if (!privateKey) {
	console.error('Set the ENS owner private key into env variable PRIVATE_KEY')
	process.exit(1)
}

const streamr = new StreamrClient({
	auth: {
		privateKey,
	}
})

const seedNodes = [
	'0x5b9f84566496425b5c6075f171a3d0fb87238df7', // Test 1a
	'0x7102c3ec5D2c5287B0fa1A3EaB87215Ae7A5D222', // Test 1b
	'0x516d519F6aeFA1475de0e024701cfc0f7BAB2964', // Test 1c
	'0x8ca52fdbdeda4935b03fbc89093120127304c8a9', // Test 2a
	'0x8730e4ABcC540Ade7f998177641dCC61182F5C35', // Test 2b
	'0x1c8EB3422ea7B0F4CDd5BAE90cd609CE8339e4D4', // Test 2c
	'0xd9696d78e45072a78fb1392845f33a548904e3b4', // Test 3a
	'0x5F3E822f5c736a79ff090D60C17e4d270502F98C', // Test 3b
	'0x4C26dee4308E4d15C3e7F18f7E82eF31B2B8EEF4', // Test 3c
	'0x5792240eFeF33Ce9742D158007AD43F4487620B6', // Test 3d
].map(seedNodeId => seedNodeId.toLowerCase())

const chains = [
	'ethereum',
	'polygon',
]

function capitalize(str: string): string {
	return `${str.charAt(0).toUpperCase()}${str.slice(1)}`
}

;(async () => {
	const myAddress = await streamr.getAddress()

	for (const chain of chains) {

		const blockStreamId = `eth-watch.eth/${chain}/blocks`
		const eventStreamId = `eth-watch.eth/${chain}/events`

		// Try to create streams, this will fail if they already exist
		try {
			await streamr.createStream({
				id: blockStreamId,
				description: `${capitalize(chain)} block observations from EthWatch seed nodes, see https://ethwatch.live`,
				partitions: 1,
			})
		} catch (err) {
			console.log(`Block stream creation failed, maybe it already exists? ${err}`)
		}

		try {
			await streamr.createStream({
				id: eventStreamId,
				description: `${capitalize(chain)} event confirmations from EthWatch seed nodes, see https://ethwatch.live`,
				partitions: 50,
			})
		} catch (err) {
			console.log(`Event stream creation failed, maybe it already exists? ${err}`)
		}

		// Grant and revoke stream permissions
		for (const streamId of [blockStreamId, eventStreamId]) {
			const seedNodePermissions: UserPermissionAssignment[] = seedNodes.map((seedNodeAddress) => {
				return { 
					user: seedNodeAddress,
					permissions: [StreamPermission.PUBLISH]
				}
			})
			
			const stream = await streamr.getStream(streamId)
			const permissions = await stream.getPermissions()

			// Is there someone who shouldn't have permissions anymore?
			const revokeList: UserPermissionAssignment[] = []
			
			permissions.forEach((permission) => {
				// @ts-ignore
				if (permission.user && permission.user !== myAddress.toLowerCase() && seedNodes.indexOf(permission.user) === -1) {
					revokeList.push({
						// @ts-ignore
						user: permission.user, 
						permissions: [],
					})
				}
			})

			if (revokeList.length) {
				console.log(`Revoking permissions for ${streamId}: ${revokeList.map(revokePerm => revokePerm.user).join(', ')}`)
				await streamr.setPermissions({
					streamId,
					assignments: revokeList,
				})
			}

			console.log(`Setting permissions for ${streamId}`)
			await streamr.setPermissions(
				{
					streamId,
					assignments: [
						// This address should retain grant and edit permissions (but no publish, that's only for seed nodes)
						{
							user: myAddress,
							permissions: [StreamPermission.GRANT, StreamPermission.EDIT, StreamPermission.DELETE],
						},
						// Grant public subscribe permission
						{
							public: true,
							permissions: [StreamPermission.SUBSCRIBE],
						},
						// Grant publish permission to seed nodes
						...seedNodePermissions,
					],
				},
			)
		}
	}
})()
