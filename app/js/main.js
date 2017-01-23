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
    var $sysInfos = $('.sysInfos');
    var $numUsers = $('.numUsers');
    var $userLists = $('.userLists');
    var $messages = $('.messages');
    var $inputMessage = $('.inputMessage');
    var $loginPage = $('.login.page');
    var $chatPage = $('.chat.page');
    var $clearBtn = $('.clearBtn');

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
    function checkUsername() {
        clientName = cleanInput($usernameInput.val().trim());
        if (clientName) {
            socket.emit('check username', clientName);
        }
    }

    //用户名重复，修改用户名
    function changeUsername(msg) {
        clientName = '';
        var $form = $(".form");
        var $prompt = $('<p class = "prompt">')
            .css('color', 'red')
            .text(msg);
        $form.append($prompt);
        setTimeout(function() {
            $prompt.fadeOut();
        }, 500);
    }

    //登录成功
    function loginSuccess() {
        $loginPage.fadeOut();
        $chatPage.show();
        $loginPage.off('click');
        $currentInput = $inputMessage.focus();
    }

    /*DOM操作*/
    //聊天框内容转义，避免注入攻击
    function cleanInput(input) {
        return $('<div/>').html(input).text();
    }

    //添加系统信息
    function addSysInfo(msg) {
        var $sysInfoEl = $('<li>').addClass('sysInfo');
        if (msg) {
            $sysInfoEl.text('系统:  ' + msg);
            $sysInfos.append($sysInfoEl);
        }
        $sysInfos[0].scrollTop = $sysInfos[0].scrollHeight;
    }

    //增加聊天区域显示内容
    function addChatMessage(data) {
        var $typingMessages = getTypingMessages(data.from);
        var fade = true;
        if ($typingMessages.length !== 0) {
            fade = false;
            $typingMessages.remove();
        }

        var typingClass = data.typing ? 'typing' : '';
        var $usernameDiv = $('<span class="username"/>').text(data.from + ": ")
            .css('color', getUsernameColor(data.from));
        var $messageBodyDiv = $('<span class="messageBody">').text(data.msg);
        var $messageDiv = $('<li class="message"/>').data('username', data.from);

        if (data.from !== clientName) { //非本人发出信息
            if (data.mode == 'private') { //其它用户私聊
                $usernameDiv.click(function() {
                    $inputMessage.val('@' + data.from + ': ' + $inputMessage.val()).focus();
                });
                $messageBodyDiv.css('color', 'blue');
            } else if (data.mode == 'public') { //公聊
                if (typingClass) {
                    $messageDiv.addClass(typingClass);
                } else {
                    $usernameDiv.dblclick(function() {
                        $inputMessage.val('@' + data.from + ': ' + $inputMessage.val()).focus();
                    });
                }
            } else { //系统发送信息
                $messageBodyDiv.css('color', 'red');
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

    //清空聊天区域
    function clearChatMessage() {
        $(".message").remove();
    }

    //用户列表增加用户
    function addUserList(data) {
        $numUsers.text(data.numUsers + '位用户在线:');
        var $userListElement = $('<li class = "userList">').text(data.username)
            .data('username', data.username);
        $userLists.append($userListElement);
    }

    //用户列表清除用户
    function removeUserList(data) {
        $numUsers.text(data.numUsers + '位用户在线:');
        $('.userList').filter(function(i) {
            return $(this).data('username') === data.username;
        }).remove();
    }

    /*改变状态*/

    //增加'XX正在输入'
    function addTypingStatus(username) {
        addChatMessage({
            mode: 'public',
            from: username,
            typing: true,
            msg: '正在输入...'
        });
    }

    //取消'XX正在输入'
    function removeTypingStatus(username) {
        getTypingMessages(username).fadeOut(function() {
            $(this).remove();
        });
    }

    //获得“xx正在输入”的节点
    function getTypingMessages(username) {
        return $('.typing.message').filter(function(i) {
            return $(this).data('username') === username;
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
        if (connected && (!mode)) { //公聊状态才发送输入状态     
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
                checkUsername();
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

    $clearBtn.click(function() {
        clearChatMessage();
    });



    /*状态监听*/
    socket.on('username exists', function(data) {
        changeUsername(data.msg);
    });

    socket.on('login success', function(msg) {
        loginSuccess();
        connected = true;
        addSysInfo(msg);
    });

    socket.on('add userList', function(data) {
        addUserList(data);
    });

    socket.on('remove userList', function(data) {
        removeUserList(data);
    });
    socket.on('new message', function(data) {
        addChatMessage(data);
    });

    socket.on('user joined', function(username) {
        addSysInfo(username + ' 已加入!');
    });

    socket.on('user left', function(username) {
        addSysInfo(username + ' 已离开!');
        removeTypingStatus(username);
    });

    socket.on('typing', function(username) {
        addTypingStatus(username);
    });

    socket.on('stop typing', function(username) {
        removeTypingStatus(username);
    });

    socket.on('disconnect', function() {
        addSysInfo('您已失去连接');
    });

    socket.on('reconnect', function() {
        addSysInfo('您已经重新连接');
        if (clientName) {
            socket.emit('check username', clientName);
        }
    });

    socket.on('reconnect_error', function() {
        addSysInfo('尝试重连失败');
    });

});