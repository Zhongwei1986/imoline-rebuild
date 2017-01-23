/*服务器端程序*/

//创建HTTP服务器
var express = require('express'); 
var app = express(); 
var server = app.listen(3000); 
var io = require('socket.io').listen(server);

app.use(express.static(__dirname + '/app'));

//Chatroom
var numUsers = 0; 
var unames = {};
var usockets = {}; 

io.on("connection", function(socket) {
    var addedUser = false;
    var socketId = '';   
    
    //sysInfo data数据结构(根据时间不同，可以选择不同属性值)
    //msg: 需要显示的系统提示内容
    //numUsers: 当前聊天室的用户数 
    //username: 系统消息关联的用户名
    socket.on('add user', function(username) {
        if (addedUser) return;
        if (username in unames) {
            socket.emit('username exists', {            	
            	msg: '昵称已存在,请更换其它昵称'
            });
            return;
        }
        socketId = username;
        unames[username] = username;
        usockets[username] = socket; 
        ++numUsers; 
        addedUser = true;

        socket.emit('login success', {        	
            numUsers: numUsers
        });
       
        socket.broadcast.emit('user joined', {        	
            username: socketId,
            numUsers: numUsers,
        });

        io.sockets.emit('add userList', {  //增加用户列表
        	username: socketId,
        	numUsers: numUsers
        });
    });

    socket.on('disconnect', function() {
        if (addedUser) { 
            --numUsers;
            addedUser = false;
            delete unames[socketId];
            delete usockets[socketId];            
            socket.broadcast.emit('user left'，'remove userList', {
                username: socketId,
                numUsers: numUsers,
            });            
        }
    });

    //聊天区域data数据结构
    //method: 消息类型，public/private/system
    //from: 消息来源
    //to: 消息目的
    //msg: 消息内容
    socket.on('typing', function() {
        socket.broadcast.emit('typing', {        	   
            from: socketId
        });
    });
    
    socket.on('stop typing', function() {
        socket.broadcast.emit('stop typing', {
            from: socketId
        });
    });

    socket.on('new message', function(data) {
        if (!data.to) { 
            io.sockets.emit('new message', data);
        } else if (data.to in unames) {    
            usockets[data.to].emit('new message', data);
            usockets[data.from].emit('new message', data); 
        } else {            
            usockets[data.from].emit('new message', {
                mode: 'system',
                from: '系统',
                to: data.from,
                msg: '私聊对象已离开!'
            });
        }
    }); 
});