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

   
    socket.on('new message', function(data) {
        if (!data.to) { 
            io.sockets.emit('new message', data);
        } else if (data.to in unames) {    
            usockets[data.to].emit('new message', data);
            usockets[data.from].emit('new message', data); 
        } else { 
            var newData = {
                mode: 'system',
                from: '系统提示',
                to: data.from
            };
            usockets[data.from].emit('new message', newData);
        }
    });

    
    socket.on('check username', function(username) {
        if (addedUser) return;
        if (username in unames) {
            socket.emit('username exists', '昵称已存在,请更换其它昵称');
            return;
        }
        socketId = username;
        unames[username] = username;
        usockets[username] = socket; 
        ++numUsers; 
        addedUser = true;

        socket.emit('login', {
            numUsers: numUsers
        });

       
        socket.broadcast.emit('user joined', {
            username: socketId,
            numUsers: numUsers,
        });
    });

    
    socket.on('typing', function() {
        socket.broadcast.emit('typing', {
            mode: 'public',
            from: socketId,
            to: null,
            msg: '正在输入',
        });
    });

    
    socket.on('stop typing', function() {
        socket.broadcast.emit('stop typing', {
            from: socketId
        });
    });

    socket.on('action', function(data) {
        console.log('here we are in action event and data is: ' + data);
    });
   
    socket.on('disconnect', function() {
        if (addedUser) { 
            --numUsers;
            delete unames[socketId];
            delete usockets[socketId];            
            socket.broadcast.emit('user left', {
                username: socketId,
                numUsers: numUsers,
            });
            addedUser = false;
        }
    });
});