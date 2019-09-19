const Item = require('mm_machine').Item;

var fs = require("fs");

if (!$.dict.user_id) {
	$.dict.user_id = "user_id";
}

/**
 * @description db数据库开发驱动类
 * @extends {Item}
 * @class 
 */
class Drive extends Item {
	/**
	 * @description 构造函数
	 * @param {String} dir 当前目录
	 * @constructor
	 */
	constructor(dir) {
		super(dir, __dirname);
		this.default_file = "./db.json";

		/**
		 * 配置参数
		 */
		this.config = {
			// 标题
			"title": "",
			// 描述
			"description": "",
			// 名称
			"name": "",
			// 表名
			"table": "",
			// 主键，用于实体模型
			"key": "",
			// 字段
			"fields": [
				/* */
			]
		};

		/**
		 * @description 创建字段模型
		 * @param {Object} obj
		 * @property {String} obj.name 字段名称
		 * @param {Object} dflt_value 默认值
		 * @param {Object} notnull 是否非空
		 * @param {Object} type 字段类型
		 * @param {Object} pk 是否主键
		 * @param {Object} note 字段备注
		 */
		Drive.prototype.model = function(fields) {
			var {
				name,
				dflt_value,
				notnull,
				type,
				pk,
				note,
				auto
			} = fields;

			var tp = type.left("(", true);
			var len = type.between("(", ")");
			var min_length = 0;
			var max_length = 0;
			var decimal = 0;
			if (len) {
				max_length = Number(len.left(",", true));
				var d = len.right(",");
				if (d) {
					decimal = Number(d);
				}
			}
			var min = 0;
			var max = 0;

			var note = note.replace("：", ":");
			var title = note.left(":", true).trim();
			var desc = note.right(":");
			var description = "";

			if (desc) {
				// 获取主要注释
				description = desc.right(']', true).trim();
				var range = desc.between("[", "]");
				if (range) {
					// 取最小值
					var min_str = range.left(',', true);
					if (min_str) {
						if (tp === 'varchar') {
							min_length = Number(min_str);
						} else {
							min = Number(min_str);
						}
					}
					// 取最大值
					var max_str = range.right(',');
					if (max_str) {
						var n = Number(max_str);
						if (tp === 'varchar') {
							if (n < max_length) {
								max_length = n;
							}
						} else {
							max = n;
						}
					}
				}
			}
			if (min === 0 && name.indexOf('_id') !== -1) {
				min = 1;
			}
			if (max === 0) {
				switch (tp) {
					case "tinyint":
						max = 1;
						break;
					case "smallint":
						max = 32767;
						break;
					case "mediumint":
						max = 8388607;
						break;
					case "int":
						max = 2147483647;
						break;
					case "bigint":
						max = 0;
						break;
					default:
						break;
				}
				if (max_length) {
					var num = Math.pow(10, max_length);
					if (max > num) {
						max = num;
					}
				}
			}

			var not_null = pk || dflt_value == true || tp.has('int') || tp === "float" || tp === "decimal";
			if (not_null && dflt_value) {
				if (tp === 'varchar' || tp === 'text') {
					dflt_value = "";
				} else {
					dflt_value = "0";
				}
			}
			if (pk && !this.config.key) {
				this.config.key = name;
			}

			return {
				// 字段名
				"name": name,
				// 字段标题
				"title": title,
				// 字段描述
				"description": description,
				// 字段类型 smallint短整数、mediumint中长整数、int整数、float浮点数、double双精度、tinyint二进制(0和1的布尔)、text文本、varchar字符串、datetime日期时间、date日期、time时间、timestamp时间戳
				"type": tp,
				// 是否主键
				"key": pk,
				// 自动
				"auto": auto,
				// 是否含符号
				"symbol": tp === "float" || tp === "decimal",
				// 是否填充零，用于数字类型
				"fill_zero": false,
				// 非空
				"not_null": not_null,
				// 最小长度
				"min_length": min_length,
				// 最大长度
				"max_length": max_length,
				// 最小值
				"min": min,
				// 最大值
				"max": max,
				// 进制值
				"decimal": decimal,
				// 默认值
				"default": dflt_value,
				// 联表入，唯一主键在其他表中，然后关联到该表
				"join_in": [],
				// 联表出，唯一主键在该表中，然后关联其他表
				"join_out": []
			};
		};

		/*
		{
		  name: 'nickname',
		  cid: 10,
		  dflt_value: null,
		  notnull: true,
		  type: 'varchar(16)',
		  pk: false,
		  note: ''
		}
		*/

		/**
		 * @description 从数据库更新配置
		 * @param {Object} db 数据库管理器
		 * @param {Boolean} cover 是否覆盖文件
		 */
		Drive.prototype.update_config = async function(db, cover) {
			var cg = this.config;
			// 设置表名
			db.table = cg.table + "";
			var list = [];

			// 获取所有字段
			var fields = await db.fields();
			for (var i = 0; i < fields.length; i++) {
				var field = this.model(fields[i]);
				list.push(field);
			}
			this.config.fields = list;
			if (!this.config.name) {
				this.config.name = cg.table;
			}
			await this.update_app(cover);
		};

		/**
		 * @description 通过配置更新数据库
		 * @param {Object} db 数据库管理器
		 */
		Drive.prototype.update_table = async function(db) {
			var cg = this.config;
			db.table = cg.table + "";
			var fields = db.fields();
			var list = cg.fields;

			// 删除配置中没有的字段
			for (var i = 0; i < fields.length; i++) {
				var o = fields[i];
				var obj = list.get({
					name: o.name
				});

				if (!obj) {
					db.field_del(o.name)
				}
			}

			// 添加或修改配置
			for (var i = 0; i < list.length; i++) {
				var o = list[i];
				var obj = fields.get({
					name: o.name
				});

				if (!obj) {
					// 如果本身没有该字段则添加
					db.field_add(o.name, o.type, o.default, o.auto, o.key);
				} else {
					// 如果有则修改
					db.field_set(o.name, o.type, o.default, o.auto, o.key);
				}
			}
		};

		/**
		 * @description 更新应用，根据表生成目录结构和文件
		 * @param {Boolean} cover 是否覆盖文件
		 */
		Drive.prototype.update_app = async function(cover) {
			var cg = this.config;
			var f;
			var dir_api;
			if (!this.filename) {
				var p = "./app/".fullname();
				var dir_arr = cg.table.split('_');
				var scope = dir_arr[0];
				var dir = p + scope;
				if (!fs.existsSync(dir)) {
					fs.mkdirSync(dir);
				}

				dir += "/plugin";
				if (!fs.existsSync(dir)) {
					fs.mkdirSync(dir);
				}

				dir += "/api";
				if (!fs.existsSync(dir)) {
					fs.mkdirSync(dir);
				}
				dir_api = dir;
				var db_dir = dir + "/db";
				if (!fs.existsSync(db_dir)) {
					fs.mkdirSync(db_dir);
				}
				this.dir = db_dir.fullname();

				f = this.dir + cg.table.replace(scope + '_', '') + '.db.json';
				this.filename = f;
			} else {
				f = this.filename;
			}
			if (f) {
				if (!this.dir) {
					this.dir = f.dirname();
					if (!fs.existsSync(dir)) {
						fs.mkdirSync(dir);
					}
				}
				if(!dir_api)
				{
					dir_api = this.dir.dirname()
				}
				
				if (!f.hasFile()) {
					this.save();
				} else if (cover) {
					var jobj = f.loadJson();
					var o = Object.assign({}, this.config);
					if (!o.title) {
						delete o.title;
					}
					if (!o.description) {
						delete o.description;
					}
					$.push(jobj, o, true);
					f.saveText(JSON.stringify(jobj, null, 4));
				}
				this.update_api(dir_api, cover);
			}
		};

		/**
		 * @description 更新API及相关配置文件
		 * @param {String} dir API存放目录
		 * @param {Boolean} cover 是否覆盖文件
		 */
		Drive.prototype.update_api = async function(dir, cover) {
			var cg = this.config;
			var arr = cg.table.split('_');

			var name = "root";
			if (arr.length > 2) {
				name = arr[2];
			}

			var client = dir + "/api_client";
			if (!fs.existsSync(client)) {
				fs.mkdirSync(client);
			}
			client += "/" + name;
			if (!fs.existsSync(client)) {
				fs.mkdirSync(client);
			}

			var manage = dir + "/api_manage";
			if (!fs.existsSync(manage)) {
				fs.mkdirSync(manage);
			}

			manage += "/" + name;
			if (!fs.existsSync(manage)) {
				fs.mkdirSync(manage);
			}

			this.new_sql(client, manage, cover);
			this.new_param(client, manage, cover);
			this.new_api(client, manage, cover);
		};

		/**
		 * @description 新建event配置文件和文件
		 * @param {String} dir 保存的路径
		 * @param {String} path 检索路径
		 * @param {String} scope 接口域
		 */
		Drive.prototype.new_event = async function(dir, path, scope) {
			// // 添加事件
			// 				var event_dir = dir + "/event_api";
			// 				if (!fs.existsSync(event_dir)) {
			// 					fs.mkdirSync(event_dir);
			// 				}
			// 
			// 				if (dir_arr.length > 1) {
			// 					event_dir += "/" + dir_arr[1];
			// 					if (!fs.existsSync(event_dir)) {
			// 						fs.mkdirSync(event_dir);
			// 					}
			// 					this.new_event(event_dir, dir_arr[0], dir_arr[1]);
			// 				}

			var f = dir + "/action_main.js";
			if (!f.hasFile()) {
				var code = (__dirname + '/event_script.js').loadText();
				code = code.replaceAll('{0}', path).replaceAll('{1}', scope);
				f.saveText(code);
			}
		};

		/**
		 * @description 新建sql配置文件
		 * @param {String} client 客户端配置保存路径
		 * @param {String} manage 管理端配置保存路径
		 * @param {Boolean} cover 是否覆盖文件
		 */
		Drive.prototype.new_sql = async function(client, manage, cover) {
			var cg = this.config;

			var lt = cg.fields;
			var query = {};
			var where = {};
			var update = {};
			var field = "";
			var query_default = {};
			var orderby = "";
			var id = $.dict.user_id;
			// 设置sql模板
			for (var i = 0; i < lt.length; i++) {
				var o = lt[i];
				var p = o.type;
				var n = o.name;
				if (n.indexOf('password') === -1 && n.indexOf('salt') === -1) {
					field += ",`" + n + "`";
				}

				if (p === 'varchar' || p === 'text') {
					query[n] = "`" + n + "` like '%{0}%'";
					if (o.key) {
						where[n] = "`" + n + "` like '%{0}%'";
					}
				} else if (p === 'date' || p === 'time' || p === 'datetime' || p === 'datetime' || p === 'timestamp') {
					query[n + "_min"] = "`" + n + "` >= '{0}'";
					query[n + "_max"] = "`" + n + "` <= '{0}'";
				} else if (p !== 'tinyint') {
					if (!n.endWith('id')) {
						query[n + "_min"] = "`" + n + "` >= {0}";
						query[n + "_max"] = "`" + n + "` <= {0}";
						update[n + "_add"] = "`" + n + "` = `" + n + "` + {0}";

						if (n === "sort" || n === "display" || n === "orderby") {
							orderby = '`' + n + '` asc';
						}
					} else if (n === id) {
						query_default[n] = "`" + n + "` = {" + id + "}";
					}
				}
			}
			// 创建模型
			var m = {
				title: cg.title,
				table: cg.table,
				name: cg.table,
				key: cg.key,
				orderby_default: '`' + cg.key + '` desc',
				field_default: field.replace(',', ''),
				method: 'get',
				query: query,
				query_default: query_default,
				where: where,
				update: update
			};
			if (client) {
				var oj = Object.assign({}, m);
				if (orderby) {
					oj.orderby_default = orderby;
				}
				if (oj.query_default[id]) {
					oj.filter = {
						"table": "table",
						"page": "page",
						"size": "size",
						"method": "method",
						"orderby": "orderby",
						"field": "field",
						"count_ret": "count_ret"
					};
					oj.filter[id] = id;
				}
				this.save_file(client + '/sql.json', oj, cover);
			}
			if (manage) {
				delete m.method;
				m.field_hide = [];
				m.name += 2;
				delete m.query_default;
				this.save_file(manage + '/sql.json', m, cover);
			}
		}

		/**
		 * @description 保存sql配置
		 * @param {String} file 文件名
		 * @param {Object} model 配置模型
		 * @param {Boolean} cover 是否覆盖文件
		 */
		Drive.prototype.save_file = function(file, model, cover) {
			if (!file.hasFile()) {
				file.saveText(JSON.stringify(model, null, 4));
			} else if (cover) {
				var jobj = file.loadJson();
				for (var k in model) {
					var val = model[k];
					if (!val) {
						model[k] = jobj[k];
					}
				}
				$.push(jobj, model, true);
				file.saveText(JSON.stringify(jobj, null, 4));
			}
		};

		/**
		 * @description 新建param配置文件
		 * @param {String} client 客户端配置保存路径
		 * @param {String} manage 管理端配置保存路径
		 * @param {Boolean} cover 是否覆盖文件
		 */
		Drive.prototype.new_param = async function(client, manage, cover) {
			var cg = this.config;

			var lt = cg.fields;

			var cm = {
				title: cg.title,
				name: cg.table,
				add: {
					body: [],
					body_required: []
				},
				del: {
					query: [],
					query_required: []
				},
				set: {
					query: [],
					query_required: [],
					body: [],
					body_required: [],
					body_not: []
				},
				get: {
					query: [],
					query_required: []
				},
				list: []
			};

			for (var i = 0; i < lt.length; i++) {
				var o = lt[i];
				var p = o.type;
				var n = o.name;

				var m = {
					// 参数名
					"name": n,
					// 参数介绍名
					"title": o.title,
					// 参数做用描述
					"description": o.description,
					// 是否主键
					"key": o.pk,
					// 参数类型 string字符串、number数字、bool布尔、dateTime时间、object对象类型、array数组类型
					"type": "",
					// 数据存储类型
					"dataType": p,
				};

				if (p === 'varchar' || p === 'text') {
					m.type = "string";
					// 字符串相关验证
					m.string = {
						// 非空
						"notEmpty": o.not_null,
						// 最小长度
						"min": o.min_length,
						// 最大长度
						"max": o.max_length,
						// 验证字符串范围, 传入两个成员, 最小长度和最大长度。例如：[0, 0]
						"range": (o.min_length && o.max_length) ? [o.min_length, o.max_length] : [],
						// 格式验证 email、url、date、dateISO、number、digits、phone
						"format": ""
					};
					if (n.has("phone") || n === "tel") {
						m.string.format = "phone"
					} else if (n.has("url") || n === "src" || n === "source") {
						m.string.format = "url"
					} else if (n.has("date")) {
						m.string.format = "date"
					} else if (n === "num" || n === "number" || n == "count") {
						m.string.format = "digits"
					} else if (n === "money" || n === "coin") {
						m.string.format = "number"
					} else if (n.has("email")) {
						m.string.format = "email"
					}
					cm.get.query.push(n);
					cm.list.push(m);
					cm.set.body.push(n);
				} else if (p === 'date' || p === 'time' || p === 'datetime' || p === 'datetime' || p === 'timestamp') {
					m.type = "dateTime";
					cm.get.query.push(n);
					cm.get.query.push(n + "_min");
					cm.get.query.push(n + "_max");

					cm.list.push(m);
					var m_min = Object.assign({}, m);
					m_min.name = n + "_min";
					m_min.title += "——开始时间";
					cm.list.push(m_min);
					var m_max = Object.assign({}, m);
					m_max.name = n + "_max";
					m_max.title += "——结束时间";
					cm.list.push(m_max);
					cm.set.body.push(n);
				} else {
					m.type = "number";
					// 数值相关验证
					m.number = {
						// 最小值
						"min": o.min,
						// 最大值
						"max": o.max,
						// 验证字符串范围
						"range": (o.min && o.max) ? [o.min, o.max] : []
					};
					if (o.key) {
						cm.del.query_required.push(n);
						cm.set.query_required.push(n);
						cm.list.push(m);
						cm.set.body.push(n);
					} else {
						cm.del.query.push(n);
						cm.set.query.push(n);
						cm.get.query.push(n);

						cm.add.body.push(n);
						cm.set.body.push(n);
						cm.list.push(m);
						if (!n.endWith('id')) {
							cm.get.query.push(n + "_min");
							cm.get.query.push(n + "_max");
							cm.set.body.push(n + "_add");

							var m_min = Object.assign({}, m);
							m_min.name = n + "_min";
							m_min.title += "——最小值";
							cm.list.push(m_min);
							var m_max = Object.assign({}, m);
							m_max.name = n + "_max";
							m_max.title += "——最大值";
							cm.list.push(m_max);
						}
					}
				}
			}
			// 保存配置文件
			if (client) {
				this.save_file(client + '/param.json', cm, cover);
			}
			if (manage) {
				delete cm.method;
				cm.name += 2;
				this.save_file(manage + '/param.json', cm, cover);
			}
		};

		/**
		 * @description 新建api配置文件
		 * @param {String} client 客户端配置保存路径
		 * @param {String} manage 管理端配置保存路径
		 * @param {Boolean} cover 是否覆盖文件
		 */
		Drive.prototype.new_api = async function(client, manage, cover) {
			var cg = this.config;
			var arr = cg.table.split('_');
			var p = "/api/";
			if (arr.length > 1) {
				p += cg.table.right('_').replaceAll('_', '/');
			} else {
				p += arr[0];
			}
			var m = {
				"path": p,
				"name": cg.table,
				"title": cg.title,
				"description": cg.description,
				"method": "ALL",
				"cache": 60,
				"client_cache": true,
				"param_path": "./param.json",
				"sql_path": "./sql.json",
				"check_param": true
			};

			// 保存配置文件
			if (client) {
				var o = Object.assign({}, m);

				var lt = cg.fields;
				// 判断该表是否含用户ID，如果含有则需要验证才能访问
				var has = false;
				for (var i = 0; i < lt.length; i++) {
					var name = lt[i].name;
					if (name == $.dict.user_id || name == 'uid' || name == 'user_id' || name == 'userid') {
						has = true;
						break;
					}
				}
				if (has) {
					o.oauth = {
						"scope": true,
						"signIn": true,
						"user_group": [],
						"admin_group": []
					};
				}
				this.save_file(client + '/api.json', o, cover);
			}
			if (manage) {
				var o = Object.assign({}, m);
				o.oauth = {
					"scope": true,
					"signIn": true,
					"gm": 2,
					"user_group": [],
					"admin_group": []
				};
				o.path = o.path.replace("/api/", "/apis/");
				o.cache = 0;
				o.name += 2;
				this.save_file(manage + '/api.json', o, cover);
			}
		};
	}
}

exports.Drive = Drive;
