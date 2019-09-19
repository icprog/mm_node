/**
 * @description 接口主函数
 * @param {Object} ctx HTTP上下文
 * @param {Object} db 数据管理器,如: { next: async function{}, ret: {} }
 * @return {Object} 执行结果
 */
async function main(ctx, db) {
	var ret = '<html><head><title>页面标题</title></head><body><h1>文章标题</h1><p>文章正文</p><div><p>姓名:${model.name}</p><p>年龄:${model.age}</p><p>性别:${model.sex ? \'男\': \'女\' }</p></div><img src="/img/logo.png" /><div>${\'应用名称：\' + viewBag.app}</div><div>${\'所使用的服务器：\' + globalBag.server}</div></body></html>';
	var model = { name: "张三丰", age: 21, sex: true };
	return db.tpl.render(ret, model);
};

exports.main = main;