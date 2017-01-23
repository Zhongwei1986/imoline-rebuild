$(function() {   
    var FADE_TIME = 150; // ms
    var TYPING_TIMER_LENGTH = 400; // ms
    var COLORS = [ 
        '#e21400', '#91580f', '#f8a700', '#f78b00',
        '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
        '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
    ];
    
    //DOM节点
    var $window = $(window); 
    var $usernameInput = $('.usernameInput'); 
    var $sysInfo = $('.sysInfo');
    var $messages = $('.messages'); 
    var $inputMessage = $('.inputMessage');
    var $loginPage = $('.login.page'); 
    var $chatPage = $('.chat.page'); 
    
    //全局变量
    var clientName; 
    var connected = false;
    var typing = false;
    var lastTypingTime;
    var $currentInput = $usernameInput.focus();

    //创建socket.io的客户端socket对象  
    var socket = io();
    
    /*登录相关*/    
    //添加用户  
    function addUser() {
        clientName = cleanInput($usernameInput.val().trim());
        if (clientName) {
            socket.emit('add user', clientName);
        }
    }

    //用户名重复，修改用户名
    function changeUsername(msg) {
        clientName = '';
        var $form = $(".form");
        var $prompt = $('<p class = "prompt">')
            .css('color', 'yellow')
            .text(msg);
        $form.append($prompt);
        setTimeout(function() {
            $prompt.fadeOut();
        }, 500);
    }

    //登录成功
    function loginSuccess() {
        if (clientName) {
            $loginPage.fadeOut(); 
            $chatPage.show(); 
            $loginPage.off('click'); 
            $currentInput = $inputMessage.focus();           
        }
    }

    /*DOM操作*/
    //聊天框内容转移，避免注入攻击
    function cleanInput(input) {
        return $('<div/>').html(input).text();
    }    

    //添加系统信息
    function addSysInfo(data) {       
        var $sysElement = $('<li>').addClass('log').css('color','yellow'); 
        if (data.msg) {            
            $sysElement.text('系统:  ' + data.msg);
            $sysInfo.append($sysElement);
        }
    }    

    //增加聊天信息节点
    function addChatMessage(data) {
        var $typingMessages = getTypingMessages(data);
        var fade = true; 
        if ($typingMessages.length !== 0) {
            fade = false;
            $typingMessages.remove();
        }

        var typingClass = data.typing ? typing : '' ;        
        var $usernameDiv = $('<span class="username"/>').text(data.from + ": ")
                                .css('color', getUsernameColor(data.from)); 
        var $messageBodyDiv = $('<span class="messageBody">').text(data.msg); 
        var $messageDiv = $('<li class="message"/>').data('username', data.from);        
       
        if (data.from !== clientName) { //非本人发出信息
            if (data.mode == 'private') { //其它用户私聊
                $usernameDiv.dbclick(function() {
                        $inputMessage.val('@' + data.from + ': ' + $inputMessage.val()).focus();
                    });
                $messageBodyDiv.css('color', 'blue');
            } else if (data.mode == 'public') { //公聊
                if (typingClass) {

                } else {

                }
                $usernameDiv.dblclick(function() {
                    $inputMessage.val('@' + data.from + ': ' + $inputMessage.val()).focus();
                });
            } else { 
                $messageBodyDiv.css('color', 'yellow');
            }
            $messageDiv.append($usernameDiv, $messageBodyDiv);
        } else { 
            if (data.mode === 'private') { //如果是私聊
                $messageBodyDiv.css('color', 'blue');
            }
            $messageDiv.append($usernameDiv, $messageBodyDiv).addClass("right");
        }

        if (fade) { 
            $messageDiv.hide().fadeIn(FADE_TIME); 
        }
        $messages.append($messageDiv);
        $messages[0].scrollTop = $messages[0].scrollHeight; //滚动条滚到最底部
    }




    /*改变状态*/

    //增加'XX正在输入',data.from = socketIds
    function addTypingStatus(data) {
        data.typing = true;
        data.mode = 'public'
        data.msg = '正在输入'
        addChatMessage(data);
    }

    //取消'XX正在输入'
    function removeTypingStatus(data) {
        getTypingMessages(data).fadeOut(function() {
            $(this).remove();
        });
    }

    //获得“xx正在输入”的节点
    function getTypingMessages(data) {        
        return $('.typing.message').filter(function(i) {            
            return $(this).data('username') === data.from;
        });
    }

    
    //获得用户名颜色
    function getUsernameColor(username) {        
        var hash = 7; 
        for (var i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + (hash << 5) - hash;
        }        
        var index = Math.abs(hash % COLORS.length);
        return COLORS[index];
    }


    /*对外输出消息*/
    //发送信息
    function sendMessage() {
        var message = $inputMessage.val();        
        message = cleanInput(message);        
        if (message && connected) {
            $inputMessage.val(''); 
           
            var data = {}; 
            data.from = clientName;
            var targetObj = message.match(/^@([\S]+):/);    
            if (targetObj) { 
                data.to = targetObj[1]; 
                data.mode = 'private';
                var idx = targetObj[1].length + 3; 
                data.msg = message.slice(idx);
            } else {
                data.to = null;
                data.mode = 'public';
                data.msg = message;
            }
            socket.emit('new message', data);
        }
    }   

    //发送输入状态
    function updateTyping() {
        var mode = $inputMessage.val().match(/^@([\S]+):/);
        if (connected && (!mode)) {   //公聊状态才发送输入状态     
            if (!typing) { 
                typing = true; 
                socket.emit('typing'); 
            }
            lastTypingTime = (new Date()).getTime(); 

            setTimeout(function() { 
                var typingTimer = (new Date()).getTime();
                var timeDiff = typingTimer - lastTypingTime; 
                if (timeDiff >= TYPING_TIMER_LENGTH && typing) {                                                      
                    socket.emit('stop typing'); 
                    typing = false; 
                }
            }, TYPING_TIMER_LENGTH); 
        }
    }
    
    /*用户交互*/

    // Keyboard 事件
    $window.keydown(function(event) {        
        if (!(event.ctrlKey || event.metaKey || event.altKey)) {
            $currentInput.focus(); 
        }
        
        if (event.which === 13) {
            if (clientName) { 
                sendMessage(); 
                socket.emit('stop typing'); 
                typing = false; 
            } else { 
                addUser();
            }
        }
    });

    $inputMessage.on('input', function() {        
        updateTyping(); 
    });

    // Click 事件
    
    $loginPage.click(function() {
        $currentInput.focus();
    });
    
    $inputMessage.click(function() {
        $inputMessage.focus();
    });
    


    /*状态监听*/

    socket.on('username exists', function(data) {
        changeUsername(data.msg);
    });
    
    socket.on('login success', function(data) {
        loginSuccess();
        connected = true;      
        data.msg = "– 欢迎来到imOline –";
        addSysInfo(data);
    });
    
    socket.on('new message', function(data) {
        addChatMessage(data);
    });
    
    socket.on('user joined', function(data) {
        data.msg = data.username + ' 已加入!';
        addSysInfo(data);
    });
    
    socket.on('user left', function(data) {
        log(data.username + ' 已离开!');
        addSysInfo(data);
        removeTypingStatus(data);
    });
    
    socket.on('typing', function(data) {
        addTypingStatus(data);        
    });
    
    socket.on('stop typing', function(data) {
        removeTypingStatus(data);
    });

    socket.on('disconnect', function() {
        log('您已失去连接');
    });

    socket.on('reconnect', function() {
        log('您已经重新连接');
        if (clientName) {
            socket.emit('add user', clientName);
        }
    });

    socket.on('reconnect_error', function() {
        log('尝试重连失败');
    });

});