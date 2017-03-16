var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    fs = require('fs'),
    users = {};


var ss = require('socket.io-stream');
var path = require('path');
var fs = require('fs');


server.listen(5000);

io.set('log level', 1);
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

ss.forceBase64 = true;

io.sockets.on('connection', function(socket) {

    ss(socket).on('file', function(stream,to, data) {
    	console.log("=-=-=-111111-=-=",to);
        var filename = path.basename(data.name);
        var read = fs.createWriteStream(__dirname + "/Assets/" + filename);
        stream.pipe(read);



        stream.on('error', function(err) {
            console.log('Error : ' + err);
        });
        stream.on('data', function(chunk) {
            // console.log(chunk);
        });
        stream.on('finish', function() {
            console.log('Finish');
            // ss(users["harman"]).emit("image", stream);
        });
        stream.on('end', function() {
        	console.log("=-=-=--=-=",to);
        	var to1=to.trim();
    		to1 = to1.substr(3);
    		console.log("=-=--=-=",to1)
            users[to1].emit("recieveimage", data);
            // io..emit("recieveimage", data);

            //   	var MyFileStream = fs.createReadStream(__dirname+"/Assets/"+filename);
            // var stream1 = ss.createStream();
            // MyFileStream.pipe(stream1);

            //   	ss(socket).emit("image",MyFileStream,data);
            //       console.log('end');
        });
        stream.on('pause', function() {
            console.log('o pause');
        });


    });

    ss(socket).on('filedownload', function(stream, data, callback) {

        //== Do stuff to find your file
        callback(null,{
            name: data.name,
            size: data.size
        });

        console.log(data);
        var MyFileStream = fs.createReadStream(__dirname+"/Assets/"+data.name);
        MyFileStream.pipe(stream);

    });



    socket.on('new user', function(data, callback) {
        if (data in users) {
            callback(false);
        } else {
            callback(true);
            socket.nickname = data;
            users[socket.nickname] = socket;
            updateNicknames();
        }
    });

    function updateNicknames() {
        io.sockets.emit('usernames', Object.keys(users));
    };
    socket.on('send message', function(data, callback) {
        //console.log('message object is -----------@@@@@@@@@@@@@@@@--',socket);
        var msg = data.trim();
        if (data.substr(0, 3) === '/w ') {
            msg = msg.substr(3);
            var ind = msg.indexOf(' ') //find index of first space.
            if (ind !== -1) {
                var name = msg.substring(0, ind);
                var msg = msg.substring(ind + 1);
                if (name in users) {

                    //Here need to write DB Query to store the messages.

                    users[name].emit('whisper', { msg: msg, nick: socket.nickname });
                    users[socket.nickname].emit('whisper', { msg: msg, nick: socket.nickname });
                    console.log('------whisper------');
                } else {
                    callback('Error: Enter valid user!');
                }
            } else {
                callback('Error: Please enter a message for your private chat.');
            }

        } else {
            callback('Error: Please select user.');
        }

        //io.sockets.emit('new message',{msg:msg,nick:socket.nickname});
    });

    socket.on('disconnect', function(data) {
        if (!socket.nickname) return;
        delete users[socket.nickname];
        updateNicknames();
    });

    /*// trying to serve the image file from the server
    io.on('connection', function(socket){
      fs.readFile(__dirname + '/images/2.png', function(err, buf){
        // it's possible to embed binary data
        // within arbitrarily-complex objects
        socket.emit('image', { image: true, buffer: buf.toString('base64') });
        console.log('image file is initialized--------------@@@@@@@@@@@---------------');
      });
    });*/

});
