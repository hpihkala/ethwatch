const { QueryTypes } = require('sequelize')

module.exports = class AbiDB {
	constructor(sequelize) {
		this.sequelize = sequelize
	}

	async retrieve(contractAddress) {
		await this.ensureTable()
		const result = await this.sequelize.query(
			'SELECT * FROM abis WHERE contractAddress = :contractAddress', {
				replacements: {
					contractAddress: contractAddress.toLowerCase(),
				},
				type: QueryTypes.SELECT
			}
		)
		return result[0]
	}

	async store(contractAddress, abi) {
		await this.ensureTable()
		await this.sequelize.query(
			'REPLACE INTO abis (`contractAddress`, `abi`) VALUES (:contractAddress, :abi)',
			{
				replacements: {
					contractAddress: contractAddress.toLowerCase(),
					abi,
				},
				type: QueryTypes.INSERT
			}
		)
		return this.retrieve(contractAddress)
	}

	async ensureTable() {
		if (!this.tableEnsured) {
			await this.sequelize.query(`
				CREATE TABLE IF NOT EXISTS abis (
					contractAddress varchar(255) NOT NULL,
					abi varchar(255) NULL,
					timestamp datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
					PRIMARY KEY (contractAddress)
				)`,
				{
					type: QueryTypes.RAW
				}
			)
			this.tableEnsured = true
		}
	}

	async tableExists() {
		try {
			await this.sequelize.query(
				'SELECT * FROM abis LIMIT 1',
				{
					type: QueryTypes.SELECT
				}
			)
			return true
		} catch (err) {
			return false
		}
	}

}
