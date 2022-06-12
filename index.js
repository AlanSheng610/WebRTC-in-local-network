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

