# WebRTC-in-local-network
## The project demo in Cornerstone EECS Design and Implementation 2022 spring
在前端使用WebRTC API，通過Node.js及Express，socketIO達成後端Web server 和 Websocket server

First, install node.js
```
npm install express
npm install socket.io
```
Then, download openssl for getting certificate
###Mac
https://manglekuo.medium.com/設定macos本地端https-ssl證書-b2f79bcdedf0
###Windows
Download opsnssl
http://slproweb.com/products/Win32OpenSSL.html
Go to the dictionary you installed
sudo start.bat
```
cd C:\
openssl genrsa -out privkey.key 2048
openssl req -new -x509 -key privkey.key -out cacert.pem -days 1095
```

Last, edit index.js 
```
let sslOptions = {
    key: fs.readFileSync('your key'),//里面的文件替换成你生成的私钥
    cert: fs.readFileSync('your certificate')//里面的文件替换成你生成的证书
};
```