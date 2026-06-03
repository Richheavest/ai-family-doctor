// dao/baseDao.js — 通用数据库操作基类
// 封装标准 CRUD：新增、按ID查询、条件查询、逻辑删除、分页
const pool = require('../config/db');

class BaseDao {
  /**
   * @param {string} tableName - 表名
   * @param {string} primaryKey - 主键字段名，默认 'id'
   * @param {boolean} hasIsDelete - 是否有 is_delete 逻辑删除字段
   */
  constructor(tableName, primaryKey = 'id', hasIsDelete = false) {
    this.table = tableName;
    this.pk = primaryKey;
    this.hasIsDelete = hasIsDelete;
  }

  // ==================== 新增 ====================

  /**
   * 插入一条记录
   * @param {Object} data - 键值对，key 为字段名，value 为值
   * @returns {Promise<number>} 返回自增主键ID
   */
  async insert(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    const columns = keys.join(', ');

    const sql = `INSERT INTO ${this.table} (${columns}) VALUES (${placeholders})`;
    const [result] = await pool.execute(sql, values);
    return result.insertId;
  }

  /**
   * 批量插入
   * @param {Array<Object>} rows
   * @returns {Promise<number>} affectedRows
   */
  async insertBatch(rows) {
    if (!rows.length) return 0;
    const keys = Object.keys(rows[0]);
    const columns = keys.join(', ');
    const placeholders = rows.map(() => '(' + keys.map(() => '?').join(', ') + ')').join(', ');
    const values = rows.flatMap(r => keys.map(k => r[k]));

    const sql = `INSERT INTO ${this.table} (${columns}) VALUES ${placeholders}`;
    const [result] = await pool.execute(sql, values);
    return result.affectedRows;
  }

  // ==================== 查询 ====================

  /**
   * 按主键ID查询单条记录
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    let sql = `SELECT * FROM ${this.table} WHERE ${this.pk} = ?`;
    if (this.hasIsDelete) {
      sql += ' AND is_delete = 0';
    }
    const [rows] = await pool.execute(sql, [id]);
    return rows[0] || null;
  }

  /**
   * 按主键查询（不过滤 is_delete，管理员审计用）
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findByIdIncludeDeleted(id) {
    const sql = `SELECT * FROM ${this.table} WHERE ${this.pk} = ?`;
    const [rows] = await pool.execute(sql, [id]);
    return rows[0] || null;
  }

  /**
   * 条件查询单条
   * @param {Object} conditions - {字段: 值}，多个条件 AND 连接
   * @returns {Promise<Object|null>}
   */
  async findOne(conditions = {}) {
    const { where, values } = this._buildWhere(conditions);
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.table} WHERE ${where} LIMIT 1`,
      values
    );
    return rows[0] || null;
  }

  /**
   * 条件查询列表
   * @param {Object} conditions - 等值条件 {字段: 值}
   * @param {Object} options - { orderBy, page, pageSize, likeConditions, rangeConditions }
   *   - likeConditions: {字段: '模糊值'}
   *   - rangeConditions: {字段: {min: 1, max: 100}} 或 {字段: {min: 1}} / {字段: {max: 100}}
   *   - orderBy: '字段 DESC' 或 [{field: '字段', dir: 'DESC'}]
   *   - page: 页码(从1开始)
   *   - pageSize: 每页条数
   * @returns {Promise<Array>}
   */
  async find(conditions = {}, options = {}) {
    const { where, values } = this._buildWhere(conditions, options);
    let sql = `SELECT * FROM ${this.table} WHERE ${where}`;

    // 排序
    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy}`;
    }

    // 分页
    if (options.page && options.pageSize) {
      const offset = (options.page - 1) * options.pageSize;
      sql += ` LIMIT ${Number(options.pageSize)} OFFSET ${Number(offset)}`;
    }

    const [rows] = await pool.execute(sql, values);
    return rows;
  }

  /**
   * 条件查询总数
   * @param {Object} conditions
   * @param {Object} options - 支持 likeConditions / rangeConditions
   * @returns {Promise<number>}
   */
  async count(conditions = {}, options = {}) {
    const { where, values } = this._buildWhere(conditions, options);
    const sql = `SELECT COUNT(*) AS total FROM ${this.table} WHERE ${where}`;
    const [rows] = await pool.execute(sql, values);
    return rows[0].total;
  }

  /**
   * 条件查询（带分页），返回 {list, total, page, pageSize}
   */
  async findWithPage(conditions = {}, options = {}) {
    const [list, total] = await Promise.all([
      this.find(conditions, options),
      this.count(conditions, options)
    ]);
    return {
      list,
      total,
      page: options.page || 1,
      pageSize: options.pageSize || 20
    };
  }

  /**
   * 查询全部记录（慎用，自动带 is_delete 过滤）
   * @param {Object} options - {orderBy, page, pageSize}
   */
  async findAll(options = {}) {
    return this.find({}, options);
  }

  /**
   * 自定义SQL查询（仅限简单SELECT，参数化防注入）
   * @param {string} sql - SELECT语句
   * @param {Array} params
   * @returns {Promise<Array>}
   */
  async query(sql, params = []) {
    const [rows] = await pool.execute(sql, params);
    return rows;
  }

  /**
   * 执行一条自定义SQL并返回首行
   */
  async queryOne(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows[0] || null;
  }

  // ==================== 更新 ====================

  /**
   * 按主键更新
   * @param {number} id - 主键值
   * @param {Object} data - 要更新的字段 {字段: 新值}
   * @returns {Promise<number>} affectedRows
   */
  async updateById(id, data) {
    const setClauses = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(data), id];

    let sql = `UPDATE ${this.table} SET ${setClauses} WHERE ${this.pk} = ?`;
    if (this.hasIsDelete) {
      sql += ' AND is_delete = 0';
    }

    const [result] = await pool.execute(sql, values);
    return result.affectedRows;
  }

  /**
   * 条件更新
   * @param {Object} conditions - 筛选条件
   * @param {Object} data - 更新数据
   * @returns {Promise<number>} affectedRows
   */
  async update(conditions, data) {
    const setClauses = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const { where, values: whereValues } = this._buildWhere(conditions);
    const values = [...Object.values(data), ...whereValues];

    const sql = `UPDATE ${this.table} SET ${setClauses} WHERE ${where}`;
    const [result] = await pool.execute(sql, values);
    return result.affectedRows;
  }

  // ==================== 删除 ====================

  /**
   * 物理删除（硬删除，谨慎使用）
   * @param {number} id
   * @returns {Promise<number>} affectedRows
   */
  async deleteById(id) {
    const [result] = await pool.execute(
      `DELETE FROM ${this.table} WHERE ${this.pk} = ?`,
      [id]
    );
    return result.affectedRows;
  }

  /**
   * 逻辑删除（仅对有 is_delete 字段的表生效）
   * @param {number} id
   * @returns {Promise<number>} affectedRows
   */
  async softDeleteById(id) {
    if (!this.hasIsDelete) {
      throw new Error(`${this.table} 表不支持逻辑删除（无 is_delete 字段），请使用 deleteById`);
    }
    const [result] = await pool.execute(
      `UPDATE ${this.table} SET is_delete = 1 WHERE ${this.pk} = ? AND is_delete = 0`,
      [id]
    );
    return result.affectedRows;
  }

  /**
   * 条件逻辑删除
   * @param {Object} conditions
   * @returns {Promise<number>}
   */
  async softDelete(conditions) {
    if (!this.hasIsDelete) {
      throw new Error(`${this.table} 表不支持逻辑删除（无 is_delete 字段）`);
    }
    const { where, values } = this._buildWhere(conditions);
    const sql = `UPDATE ${this.table} SET is_delete = 1 WHERE ${where} AND is_delete = 0`;
    const [result] = await pool.execute(sql, values);
    return result.affectedRows;
  }

  // ==================== 工具方法 ====================

  /**
   * 构建 WHERE 子句
   * @param {Object} conditions - 等值条件
   * @param {Object} options - { likeConditions, rangeConditions }
   * @returns {{where: string, values: Array}}
   */
  _buildWhere(conditions = {}, options = {}) {
    const clauses = [];
    const values = [];

    // 1. is_delete 自动过滤
    if (this.hasIsDelete) {
      clauses.push('is_delete = 0');
    }

    // 2. 等值条件
    for (const [key, value] of Object.entries(conditions)) {
      if (value === undefined || value === null) {
        continue;
      }
      if (Array.isArray(value)) {
        // IN 查询：{status: [1, 2]}
        const placeholders = value.map(() => '?').join(', ');
        clauses.push(`${key} IN (${placeholders})`);
        values.push(...value);
      } else {
        clauses.push(`${key} = ?`);
        values.push(value);
      }
    }

    // 3. 模糊查询
    const likeConditions = options.likeConditions || {};
    for (const [key, val] of Object.entries(likeConditions)) {
      if (val) {
        clauses.push(`${key} LIKE ?`);
        values.push(`%${val}%`);
      }
    }

    // 4. 范围查询
    const rangeConditions = options.rangeConditions || {};
    for (const [key, range] of Object.entries(rangeConditions)) {
      if (range.min !== undefined && range.min !== null) {
        clauses.push(`${key} >= ?`);
        values.push(range.min);
      }
      if (range.max !== undefined && range.max !== null) {
        clauses.push(`${key} <= ?`);
        values.push(range.max);
      }
    }

    return {
      where: clauses.length > 0 ? clauses.join(' AND ') : '1=1',
      values
    };
  }
}

module.exports = BaseDao;
