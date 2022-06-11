# WebRTC-in-local-network
### The project demo in Cornerstone EECS Design and Implementation (車車課) in 2022 spring
在前端使用WebRTC API，通過Node.js及Express，socketIO達成後端Web server 和 Websocket server

### Setup
First, install node.js
```
git clone git@github.com:AlanSheng610/WebRTC-in-local-network.git
cd WebRTC-in-local-network
npm install express
npm install socket.io
```
#### CA
Download openssl for getting certificate
##### Mac
https://manglekuo.medium.com/設定macos本地端https-ssl證書-b2f79bcdedf0

##### Windows
Download opsnssl
http://slproweb.com/products/Win32OpenSSL.html
Go to the dictionary you installed
click start.bat as administrator
```
cd C:\
openssl genrsa -out privkey.key 2048
openssl req -new -x509 -key privkey.key -out cacert.pem -days 1095
```

#### Edit index.js 
```
let sslOptions = {
    key: fs.readFileSync('your key'),
    cert: fs.readFileSync('your certificate')
};
```

### Run it
```
//Mac os add sudo 
node index.js
```


### Check it on browser

open your browser, type 
```
chatting room:
https://"your ip in local network"

camera room:
https://"your ip in loacl network"/camera
```

### Find IP
##### Mac
```
ifconfig
```
##### Windows
```
ipconfig
```