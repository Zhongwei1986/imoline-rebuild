$(function() {

    //初始化常量
    var FADE_TIME = 150; // ms
    var TYPING_TIMER_LENGTH = 400; // ms
    var COLORS = [ // 颜色值数组
        '#e21400', '#91580f', '#f8a700', '#f78b00',
        '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
        '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
    ];

    
    var $window = $(window); 
    var $usernameInput = $('.usernameInput'); 
    var $messages = $('.messages'); 
    var $inputMessage = $('.inputMessage');

    var $loginPage = $('.login.page'); 
    var $chatPage = $('.chat.page'); 

    
    var clientName; 
    var connected = false;
    var typing = false;
    var lastTypingTime;
    var $currentInput = $usernameInput.focus();
    
    var socket = io();

    
    function addParticipantsMessage(data) {
        var message = '';
        if (data.numUsers === 1) {
            message += "聊天室有 1 位用户";
        } else {
            message += "聊天室有 " + data.numUsers + " 位用户";
        }
        log(message); 
    }

   
    function checkUsername() {
        clientName = cleanInput($usernameInput.val().trim());
        if (clientName) {
            socket.emit('check username', clientName);
        }
    }
    
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

    
    function loginSuccess() {
        if (clientName) {
            $loginPage.fadeOut(); 
            $chatPage.show(); 
            $loginPage.off('click'); 
            $currentInput = $inputMessage.focus();           
        }
    }
    
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

   
    function log(message, options) {
        var $el = $('<li>').addClass('log').text(message);        
        addMessageElement($el, options); 
    }
    
    function addChatMessage(data, options) {        
        var $typingMessages = getTypingMessages(data); 
        options = options || {}; 
        if ($typingMessages.length !== 0) {
            options.fade = false; 
            $typingMessages.remove(); 
        }
        
        var $usernameDiv = $('<span class="username"/>') 
            .text(data.from); 
        var $messageBodyDiv = $('<span class="messageBody">') 
            .text(data.msg); 
        var $messageDiv = $('<li class="message"/>') 
            .data('username', data.from); 
        
        var typingClass = data.typing ? 'typing' : ''; 
        if (data.from !== clientName) { 
            $messageDiv.append($usernameDiv, $messageBodyDiv);
            if (data.mode == 'system') { 
                $messageDiv.css('color', "red");
            } else if (data.mode == 'private') { 
                $usernameDiv.css('color', getUsernameColor(data.from))
                    .dbclick(function() {
                        $inputMessage.val('@' + data.from + ': ' + $inputMessage.val()).focus();
                    });
                $messageBodyDiv.css('color', 'blue');
            } else if (typingClass) { 
                $usernameDiv.css('color', getUsernameColor(data.from));
                $messageDiv.addClass(typingClass);
            } else { 
                $usernameDiv.css('color', getUsernameColor(data.from));
                $usernameDiv.dblclick(function() {
                    $inputMessage.val('@' + data.from + ': ' + $inputMessage.val()).focus();
                });
            }
        } else { 
            $messageDiv.append($usernameDiv, $messageBodyDiv).addClass("right");
            $usernameDiv.css('color', getUsernameColor(data.from));
            if (data.mode === 'private') {
                $messageBodyDiv.css('color', 'blue');
            }
        }

        addMessageElement($messageDiv, options);

    }

    
    function addChatTyping(data) {
        data.typing = true;
        addChatMessage(data);
    }

    
    function removeChatTyping(data) {
        getTypingMessages(data).fadeOut(function() {
            $(this).remove();
        });
    }
   

    function addMessageElement(el, options) {
        var $el = $(el);       
        if (!options) {
            options = {};
        }
        if (typeof options.fade === 'undefined') {
            options.fade = true;
        }
        if (typeof options.prepend === 'undefined') {
            options.prepend = false;
        }

        
        if (options.fade) { 
            $el.hide().fadeIn(FADE_TIME); 
        }
        if (options.prepend) {
            $messages.prepend($el);
        } else {
            $messages.append($el); 
        }
        $messages[0].scrollTop = $messages[0].scrollHeight;
    }
    
    function cleanInput(input) {
        return $('<div/>').html(input).text();
    }

    
    function updateTyping() {
        var mode = $inputMessage.val().match(/^@([\S]+):/);
        if (connected && (!mode)) {        
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
    
    function getTypingMessages(data) {        
        return $('.typing.message').filter(function(i) {            
            return $(this).data('username') === data.from;
        });
    }
    
    function getUsernameColor(username) {        
        var hash = 7; 
        for (var i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + (hash << 5) - hash;
        }        
        var index = Math.abs(hash % COLORS.length);
        return COLORS[index];
    }

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
    
    socket.on('username exists', function(msg) {
        changeUsername(msg);
    });
    
    socket.on('login', function(data) {
        loginSuccess();
        connected = true;      
        var message = "– 欢迎来到imOline –";
        log(message, {
            prepend: true
        });
        addParticipantsMessage(data);
    });
    
    socket.on('new message', function(data) {
        addChatMessage(data);
    });
    
    socket.on('user joined', function(data) {
        log(data.username + ' 已加入!');
        addParticipantsMessage(data);
    });
    
    socket.on('user left', function(data) {
        log(data.username + ' 已离开!');
        addParticipantsMessage(data);
        removeChatTyping(data);
    });
    
    socket.on('typing', function(data) {
        addChatTyping(data);        
    });
    
    socket.on('stop typing', function(data) {
        removeChatTyping(data);
    });

    socket.on('disconnect', function() {
        log('您已失去连接');
    });

    socket.on('reconnect', function() {
        log('您已经重新连接');
        if (clientName) {
            socket.emit('check username', clientName);
        }
    });

    socket.on('reconnect_error', function() {
        log('尝试重连失败');
    });

});