import adapterDBConnector from '../adapter-db-connector'
import { errorFeedBack } from '../FeedBack'

export class CommonEssence {
  private tableName: any
  constructor(tableName: string) {
    this.tableName = tableName
  }
  public async createEssence(payload: Object) {
    try {
      const { rows } = await adapterDBConnector.getDb().query(
        `INSERT INTO ${this.tableName} (${Object.keys(payload).join(', ')}) values (${Object.keys(payload).map((item, index) => `$${index + 1}`).join(', ')}) RETURNING *`,
        Object.values(payload)
      )
      return rows[0]
    } catch(e) {
      throw new Error(e.message)
    }
  }
  public async getEssence(identify_data: Object) {
    try {
      const { rows } = await adapterDBConnector.getDb().query(
        `SELECT * FROM ${this.tableName} WHERE ${Object.keys(identify_data).map((item, index) => `${item} = $${index + 1}`).join(', ')}`,
        Object.values(identify_data)
      )
      if (!rows.length) throw new Error(errorFeedBack.commonEmpty)
      return rows[0]
    } catch(e) {
      throw new Error(e.message)
    }
  }
  public async getEssences({ identify_data = null, limit = null, offset = null, exclude = null }: { identify_data?: Object | null, limit?: number | null, offset?: number | null, exclude?: Object | null, }) {
    try {
      let requestString = ''
      if (offset) requestString += ` OFFSET ${offset}`
      if (limit) requestString += ` LIMIT ${limit}`
      let query = `SELECT * FROM ${this.tableName}`
      let counterQuery = `SELECT COUNT(*) FROM ${this.tableName}`
      const data: any = []
      const dataCount: any = []
      if (identify_data) {
        query += ' WHERE '
        Object.keys(identify_data).forEach(item => {
          // @ts-ignore
          data.push(identify_data[item])
          query += `${item} = $${data.length}`
        })
      }
      if (exclude) {
        data.push(Object.values(exclude)[0])
        dataCount.push(Object.values(exclude)[0])
        if (!identify_data) query += ' WHERE'
        query += ` ${Object.keys(exclude)[0]} != $${data.length}`
        counterQuery += ` WHERE ${Object.keys(exclude)[0]} != $${dataCount.length}`
      }
      query += requestString
      const { rows } = await adapterDBConnector.getDb().query(query, data)
      const counter = await adapterDBConnector.getDb().query(counterQuery, dataCount)
      return { rows, count: parseInt(counter.rows[0].count) }
    } catch(e) {
      throw new Error(e.message)
    }
  }
  public async getEssencesJoin({
    from,
    join,
    identifyFrom,
    identifyJoin,
    exclude = null,
    limit = null,
    offset = null,
    fields = null
  }: {
    from: string,
    join: string,
    identifyFrom: string,
    identifyJoin: string,
    exclude?: number | null,
    fields?: string[] | null,
    limit?: number | null,
    offset?: number | null
  }) {
    try {
      let query = `SELECT ${fields ? fields.join(', ') : '*'} FROM ${from} JOIN ${join} ON ${from}.${identifyFrom} = ${join}.${identifyJoin}`
      let counterQuery = `SELECT COUNT(*) FROM ${from} JOIN ${join} ON ${from}.${identifyFrom} = ${join}.${identifyJoin}`
      if (limit && offset) query += ` OFFSET ${offset} LIMIT ${limit}`
      if (exclude) {
        query += ` WHERE ${from}.${identifyFrom} != ${exclude}`
        counterQuery += ` WHERE ${from}.${identifyFrom} != ${exclude}`
      }
      const { rows } = await adapterDBConnector.getDb().query(query)
      const counter = await adapterDBConnector.getDb().query(counterQuery)
      return { rows, count: parseInt(counter.rows[0].count) }
    } catch(e) {
      throw new Error(e.message)
    }
  }
  public async updateEssence(identify_data: Object, payload: Object) {
    try {
      const count = Object.keys(payload).length
      const { rows } = await adapterDBConnector.getDb().query(
        `UPDATE ${this.tableName} SET ${Object.keys(payload).map((item, index) => `${item} = $${index + 1}`).join(', ')} WHERE ${Object.keys(identify_data).map((item, index) => `${item} = $${count + index + 1}`).join(', ')} RETURNING *`,
        [...Object.values(payload), ...Object.values(identify_data)]
      )
      return rows[0]
    } catch(e) {
      throw new Error(e.message)
    }
  }
  public async deleteEssence(identify_data: Object) {
    try {
      await adapterDBConnector.getDb().query(
        `DELETE FROM ${this.tableName} WHERE ${Object.keys(identify_data).map((item, index) => `${item} = $${index + 1}`).join(', ')}`,
        Object.values(identify_data)
      )
      return 'ok'
    } catch(e) {
      throw new Error(e.message)
    }
  }
}