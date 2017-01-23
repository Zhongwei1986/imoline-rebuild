1、创建连接

`var ws = io.connect('http://localhost:3000')`

+  与 `http://localhost:3000` 本地服务器建立连接并赋值给 ws 对象
+  ws可以理解为客户端与服务端的一次连接对象。


2、socket.io 使用on和emit实现双向通信
```
ws.on('connect',function(){
	var nickname = window.prompt('请输入用户名');
	if(!nickname){
		nickname = untils.getName(6);//设置默认的用户名
	}
	ws.emit('join',nickname);
});
```

+ `on`：用来监听一个 emit 发射的事件，第一个参数为要监听的事件名，第二个参数为一个匿名函数用来接收对方发来的数据，该匿名函数的第一个参数为接收的数据，若有第二个参数，则为要返回的函数。

+ `emit`：用来发射一个事件或者说触发一个事件，第一个参数为事件名eventName，第二个参数为要发送的数据args，第三个参数为回调函数ack（一般省略，如需对方接受到信息后立即得到确认时，则需要用到回调函数）

+ 本段代码在服务器端对应代码为：`serverSocket.on('join',callback);`

3、服务端消息发送
+ socket.emit() ：向建立该连接的客户端发送消息
+ socket.broadcast.emit() ：向除去建立该连接的客户端的所有客户端广播
+ io.sockets.emit() ：向所有客户端广播，等同于上面两个的和

+ 强烈建议学习： https://github.com/nswbmw/N-chat/wiki/_pages 

4、关于socket.io如何判断C/S之间断开连接可以参考：
+ https://cnodejs.org/topic/51dfc648f4963ade0e48ac35
