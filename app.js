var express = require('express');

var app = express();
app.set('port', process.env.PORT || 9000);
var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = app.get('port');
var redis = require('redis');

app.use(express.static('public'));

server.listen(port, function () {
    console.log("Server listening on: http://localhost:%s", port);
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
var sub = redis.createClient();
var pub = redis.createClient();
var usernames = {};
var rooms = [];
sub.subscribe("adduser");
sub.subscribe("createroom");
sub.subscribe("sendchat");
//sub.subscribe("disconnect");
io.sockets.on('connection', function (socket) {

    sub.on('message',function(channel , message){
        console.log("application-->",channel,message);
   //     console.log(message);
         var jData= JSON.parse(message);
        if(channel == 'createroom'){
          
           rooms.push(jData.room);
        } else if(channel == 'adduser'){

        var username = jData.username;
        var room = jData.room;
        if (rooms.indexOf(jData) != -1) {
            socket.username = username;
            socket.room = room;
            usernames[username] = username;
            socket.join(room);
            socket.emit('updatechat', 'SERVER', 'You are connected. Start chatting');
            socket.broadcast.to(room).emit('updatechat', 'SERVER', username + ' has connected to this room');
        } else {
            socket.emit('updatechat', 'SERVER', 'Please enter valid code.'+rooms);
        }
        } else if(channel == 'sendchat'){

                    io.sockets.in(socket.room).emit('updatechat', socket.username, jData);
        }
        console.log("rooms in app1 ",rooms);
                    socket.emit(channel,message);
         //   socket.broadcast.to(channel).emit("updatechat","server ping by pubsub");

    });

     socket.on('createroom', function (data) {
        var new_room = ("" + Math.random()).substring(2, 7);
        rooms.push(new_room);
        data.room = new_room;
             console.log("appp",rooms);
        socket.emit('updatechat', 'SERVER', 'Your room is ready, invite someone using this ID:' + new_room);
        socket.emit('roomcreated', data);
        pub.publish('createroom',JSON.stringify(data));
    });

    socket.on('adduser', function (data) {
         console.log("applic1-->",room);
        var username = data.username;
        var room = data.room;
        console.log("room",room);
        
        pub.publish('adduser',JSON.stringify(data));
        if (rooms.indexOf(room) != -1) {
            socket.username = username;
            socket.room = room;
            usernames[username] = username;
            socket.join(room);
            socket.emit('updatechat', 'SERVER', 'You are connected. Start chatting');
            socket.broadcast.to(room).emit('updatechat', 'SERVER', username + ' has connected to this room');
        } else {
            socket.emit('updatechat', 'SERVER', 'Please enter valid code.'+rooms);
        }
    });

   

    socket.on('sendchat', function (data) {
         pub.publish('sendchat',JSON.stringify(data));
        io.sockets.in(socket.room).emit('updatechat', socket.username, data);
    });

    // socket.on('disconnect', function () {
    //     delete usernames[socket.username];
    //    // io.sockets.emit('updateusers', usernames);
    //     if (socket.username !== undefined) {
    //          pub.publish('disconnect',socket.username);
    //      //   socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
    //         socket.leave(socket.room);
    //     }
    // });
});
