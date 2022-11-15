const { Sequelize, QueryTypes } = require('sequelize')
const SQLite = require('sqlite3')
const { assert } = require('chai')
const AbiDB = require('../../src/abiDB')

describe('AbiDB', () => {
	let sequelize
	let db

	beforeEach(async () => {
		sequelize = new Sequelize(
			'abidb', '', '', 
			{
				dialect: 'sqlite',
				storage: ':memory:',
				dialectOptions: {
					mode: SQLite.OPEN_READWRITE | SQLite.OPEN_CREATE | SQLite.OPEN_FULLMUTEX,
				},
		})

		db = new AbiDB(sequelize)
	})

	afterEach(async () => {
		await sequelize.close()
	})

	// These tests must run sequentially!

	describe('tableExists', () => {
		it('resolves to false if the table does not exist', async () => {
			assert.isFalse(await db.tableExists())
		})
	})

	describe('ensureTable', () => {
		it('creates the table if it does not exist', async () => {
			await db.ensureTable()
			assert.isTrue(await db.tableExists())
		})
		it('resolves if the table already exists', async () => {
			await db.ensureTable()
			await db.ensureTable()
		})
	})

	describe('store', () => {
		it('stores abis', async () => {
			const abi = await db.store('0xABCdef', 'test')
			assert.equal(abi.contractAddress, '0xabcdef')
			assert.equal(abi.abi, 'test')
			assert.isNotNull(abi.timestamp)
		})	

		it('stores null abis', async () => {
			const abi = await db.store('0xABCdef', null)
			assert.equal(abi.contractAddress, '0xabcdef')
			assert.equal(abi.abi, null)
			assert.isNotNull(abi.timestamp)
		})	
	})


	it('retrieves abis', async () => {
		const storedAbi = await db.store('0xABCdef', 'test')
		const retrievedAbi = await db.retrieve('0xABCdef')
		assert.deepEqual(storedAbi, retrievedAbi)
	})

})
