/**
 * @fileOverview 微信机器人插件(源自图灵)
 * @author <a href="http://qww.elins.cn">邱文武</a>
 * @version 1.0
 */
const apikey = "2d5e65071a334883822039bf5747f6d4";

var http = new $.Http();

/**
 * @description 插件对象
 */
module.exports = {
	/**
	 * @description 初始化
	 * @param {Object} option 配置参数
	 * @return {String} 成功返回null, 否则返回错误提示
	 */
	init(option) {
		var msg = null;
		return msg;
	},

	/**
	 * @description 安装
	 * @param {Object} option 配置参数
	 * @return {String} 成功返回null,否则返回错误提示
	 */
	install(option) {
		var msg = null;
		return msg;
	},

	/**
	 * @description 卸载
	 * @param {Object} option 配置参数
	 * @return {String} 成功返回null,否则返回错误提示
	 */
	uninstall(option) {
		var msg = null;
		return msg;
	},

	/**
	 * @description 更新
	 * @param {Object} option 配置参数
	 * @return {String} 成功返回null, 否则返回错误提示
	 */
	update(option) {
		var msg = null;
		return msg;
	},

	/**
	 * @description 启动
	 * @param {Object} opiton 配置参数
	 * @return {String} 成功返回null,否则返回错误提示
	 */
	start(option) {
		var msg = null;
		return msg;
	},

	/**
	 * @description 暂停
	 * @param {Object} opiton 配置参数
	 * @return {String} 成功返回null,否则返回错误提示
	 */
	stop(option) {
		var msg = null;
		return msg;
	},

	/**
	 * @description 结束
	 * @param {Object} opiton 配置参数
	 * @return {String} 成功返回null,否则返回错误提示
	 */
	end(option) {
		var msg = null;
		return msg;
	},

	/**
	 * @description 插件
	 * @param {String} item 插件项
	 * @return {Object} 旗下插件和信息
	 */
	help(item) {
		var tip = "";
		switch (item) {
			case "run":
				break;
			default:
				break;
		}
		return tip;
	},

	/**
	 * @description 聊天（通过聊天的方式驱动插件, 用于机器人开发）
	 * @param {String} from_user 发送消息人
	 * @param {String} to_user 接收消息人
	 * @param {String} content 内容
	 * @param {String} group 群组 如果是个人，群组为空
	 * @param {Number} type 群类型, 1永久会话/群、2临时会话/群
	 * @param {String} msg_type 消息类型, event事件型、message消息型。默认消息型
	 * @param {Object} 数据管理器
	 * @return {String} 回复内容
	 */
	async chat(from_user, to_user, group, content, type, msg_type, db) {
		var pm = {
			"reqType": 0,
			"perception": {
				"inputText": {
					"text": content
				},
				"selfInfo": {
					"location": {
						"city": "深圳",
						"province": "广东",
						"street": "粤海街道"
					}
				}
			},
			"userInfo": {
				"apiKey": apikey,
				"userId": from_user
			}
		};
		var res = await http.post("http://openapi.tuling123.com/openapi/api/v2", pm, null, 'json');
		var ret;
		if (res && res.body) {
			try {
				var result = res.body.toJson().results[0].values.text;
				if (result.indexOf('次数超限') === -1) {
					ret = result;
				}
			} catch (e) {
				//TODO handle the exception
			}
		}
		return ret;
	}
};
