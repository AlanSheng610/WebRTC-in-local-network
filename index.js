var express = require('express');
var app = express();
var http = require('http').createServer(app);

var fs = require('fs');
let sslOptions = {
    key: fs.readFileSync('./CA/localhost.key'),//key
    cert: fs.readFileSync('./CA/localhost.crt')//CA
};


const https = require('https').createServer(sslOptions, app);

var io = require('socket.io')(https);

var path = require('path');
app.use(express.static(path.join(__dirname, '/public/')));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
  });




io.on("connection", (socket) => {
    socket.join( socket.id );

    console.log("a user connected " + socket.id);

    socket.on("disconnect", () => {
        console.log("user disconnected: " + socket.id);
        //如果有user斷聯，廣播給其他用戶
        socket.broadcast.emit('user disconnected', socket.id);
    });

    
    //新user加入，轉發消息給其他用戶
    socket.on('new user greet', (data) => {
        console.log(data);
        console.log(socket.id + ' greet ' + data.msg);
        socket.broadcast.emit('need connect', {sender: socket.id, msg : data.msg});
    });
    //在線的user回應新user訊息的轉發
    socket.on('ok we connect', (data) => {
        io.to(data.receiver).emit('ok we connect', {sender : data.sender});
    });

    //SDP 訊息轉發
    socket.on( 'sdp', ( data ) => {
        console.log('sdp');
        console.log(data.description);
        //console.log('sdp:  ' + data.sender + '   to:' + data.to);
        socket.to( data.to ).emit( 'sdp', {
            description: data.description,
            sender: data.sender
        } );
    } );

    //ice candidates 訊息轉發
    socket.on( 'ice candidates', ( data ) => {
        console.log('ice candidates:  ');
        console.log(data);
        socket.to( data.to ).emit( 'ice candidates', {
            candidate: data.candidate,
            sender: data.sender
        } );
    } );

});


https.listen(443, () => {
    console.log('https listening on *:443');
});

