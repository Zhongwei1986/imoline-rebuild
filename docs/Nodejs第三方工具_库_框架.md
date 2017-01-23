# Nodejs第三方工具、库、框架

##工具
+ supervisor：监控本地JS文件变动，主要用于本地调试时自动重启服务。
	+ 全局安装： `npm install -g supervisor`
	+ 使用: `supervisor XXX.js`

+ nrm: npm registry管理工具
	+ 全局安装： `npm i -g nrm`
	+ 基本用法：
		+ `nrm ls` 显示可用npm registry地址
		+ `nrm use cnpm` 切换npm registry
	+ 更多信息：[Github](https://github.com/Pana/nrm)	 

##库
+ socket.io: 两个部分，在浏览器中的客户端库和面向NodeJS的服务端库，两者存在几乎一样的API。
	+ 服务端安装： `npm install socket.io --save`, `--save`用于添加socket.io模块至package.json的dependencies中
	+ 客户端应用: 引用本地JS文件或CDN
	+ 使用：[官方文档](http://socket.io/docs/)
	
##框架
+ express: 利用内置`http`模块实现的功能强大的WEB应用程序框架，其本身能实现强大的WEB功能的同时还能为其它框架提供基础设施。
	+ 服务端安装：`npm i express S`
	+ 使用：[官方文档](http://expressjs.com/en/starter/installing.html)