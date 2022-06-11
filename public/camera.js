//取得用戶的攝影機和麥克風
function getUserMedia(constrains, success, error) {
    if (navigator.mediaDevices.getUserMedia) {
        //最新標準API
        //最新标准API
        promise = navigator.mediaDevices.getUserMedia(constrains).then(success).catch(error);
    } else if (navigator.webkitGetUserMedia) {
        //webkit內核瀏覽器
        promise = navigator.webkitGetUserMedia(constrains).then(success).catch(error);
    } else if (navigator.mozGetUserMedia) {
        //Firefox瀏覽際
        promise = navagator.mozGetUserMedia(constrains).then(success).catch(error);
    } else if (navigator.getUserMedia) {
        //舊版API
        promise = navigator.getUserMedia(constrains).then(success).catch(error);
    }
}
function canGetUserMediaUse() {
    return !!(navigator.mediaDevices.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
}



const localVideoElm = document.getElementById("video-local");
$('document').ready(() => {

    //拍照功能
    $('#capture').click(() => {
        let video = localVideoElm//原生dom
        let isPlaying = !(video.paused || video.ended || video.seeking || video.readyState < video.HAVE_FUTURE_DATA)

        if (isPlaying) {
            let canvas = $('#capture-canvas')
            canvas.attr('width', localVideoElm.clientWidth);//設定canvas的寬度
            canvas.attr('height', localVideoElm.clientHeight);//設定canvas的高度

            let img = $('<img>')
            img.attr('width', localVideoElm.clientWidth);//设置圖片的寬度
            img.attr('height', localVideoElm.clientHeight);//设置圖片的高度

            //canvas[0] //jQuery对象转dom
            var context = canvas[0].getContext('2d');
            //在canvas上畫圖，其畫圖坐标为0,0; 
            //畫圖大小为攝影機的的寬高。
            context.drawImage(localVideoElm, 0, 0, localVideoElm.clientWidth, localVideoElm.clientHeight);
            //依據canvas内容進行編碼，轉成圖片
            var data = canvas[0].toDataURL('image/png');
            img.attr('src', data);
            //插入到id為capture-list
            $('#capture-list').append($('<li></li>').html(img));
        }
    })


});

//STUN,TURN server設定參數
const iceServer = {
    iceServers: [{ urls: ["stun:ss-turn1.xirsys.com"] }, { username: "CEqIDkX5f51sbm7-pXxJVXePoMk_WB7w2J5eu0Bd00YpiONHlLHrwSb7hRMDDrqGAAAAAF_OT9V0dWR1d2Vi", credential: "446118be-38a4-11eb-9ece-0242ac140004", urls: ["turn:ss-turn1.xirsys.com:80?transport=udp", "turn:ss-turn1.xirsys.com:3478?transport=udp"] }]
};

//PeerConnection
var pc = [];
var localStream = null;

function InitCamera() {
    if (canGetUserMediaUse()) {
        getUserMedia({
            video: true,
            audio: true
        }, (stream) => {
            localStream = stream;
            localVideoElm.srcObject = stream;
            $(localVideoElm).width(800);
        }, (err) => {
            console.log('取不到用戶的媒體設備: ', err.name, err.message);
        });
    } else {
        alert('瀏覽器不兼容');
    }

}

function StartCall(parterName, createOffer) {

    pc[parterName] = new RTCPeerConnection(iceServer);
    //如果有localStream，直接拿Tracks並使用addTrack加入
    if (localStream) {
        localStream.getTracks().forEach((track) => {
            pc[parterName].addTrack(track, localStream);//should trigger negotiationneeded event
        });

    } else {
        //重新啟動攝影機並取得
        if (canGetUserMediaUse()) {
            getUserMedia({
                video: true,
                audio: true
            }, function (stream) {
                localStream = stream;

                localVideoElm.srcObject = stream;
                $(localVideoElm).width(800);

            }, function (error) {
                console.log("取不到用戶的媒體設備:", error.name, error.message);
            })
        } else { alert('瀏覽器不兼容'); }

    }

    //如果是呼叫方,createOffer請求
    if (createOffer) {
        //是創建和發送一個請求，給被叫方，要求answer
        pc[parterName].onnegotiationneeded = () => {
            //https://developer.mozilla.org/zh-CN/docs/Web/API/RTCPeerConnection/createOffer

            pc[parterName].createOffer().then((offer) => {
                return pc[parterName].setLocalDescription(offer);
            }).then(() => {
                //把發起者的描述信息通過Signal Server發送到接收者
                socket.emit('sdp', {
                    type: 'video-offer',
                    description: pc[parterName].localDescription,
                    to: parterName,
                    sender: socket.id
                });
            })
        };
    }

    //處理icecandidate
    pc[parterName].onicecandidate = ({ candidate }) => {
        socket.emit('ice candidates', {
            candidate: candidate,
            to: parterName,
            sender: socket.id
        });
    };
    //增加track
    pc[parterName].ontrack = (ev) => {
        let str = ev.streams[0];

        if (document.getElementById(`${parterName}-video`)) {
            document.getElementById(`${parterName}-video`).srcObject = str;
        } else {
            let newVideo = document.createElement('video');
            newVideo.id = `${parterName}-video`;
            newVideo.autoplay = true;
            newVideo.controls = true;
            //newVideo.className = 'remote-video';
            newVideo.srcObject = str;

            document.getElementById('videos').appendChild(newVideo);
        }
    }



}

var socket = io();

socket.on('connect', () => {
    InitCamera();

    //輸出內容 其中 socket.id 是當前socket連接的唯一ID
    console.log('connect ' + socket.id);

    $('#user-id').text(socket.id);

    pc.push(socket.id);

    socket.emit('new user greet', {
        sender: socket.id,
        msg: 'hello world'
    });

    socket.on('need connect', (data) => {

        console.log(data);
        //創建新的li並添加到用戶列表中
        let li = $('<li></li>').text(data.sender).attr('user-id', data.sender);
        $('#user-list').append(li);
        //創建一個按鈕
        let button = $('<button class="call">通话</button>');
        button.appendTo(li);
        //監聽按鈕的點擊事件, 這是個demo 需要添加很多東西，比如不能重複撥打已經連接的用戶
        $(button).click(function () {
            //$(this).parent().attr('user-id')
            console.log($(this).parent().attr('user-id'));
            //點擊時，開啟對該用戶的通話
            StartCall($(this).parent().attr('user-id'), true);
        });

        socket.emit('ok we connect', { receiver: data.sender, sender: socket.id });
    });
    //得到用戶失去連接的訊息
    socket.on('user disconnected', (socket_id) => {
        console.log('disconnect : ' + socket_id);

        $('#user-list li[user-id="' + socket_id + '"]').remove();
    })
    socket.on('ok we connect', (data) => {
        console.log(data);

        $('#user-list').append($('<li></li>').text(data.sender).attr('user-id', data.sender));
    });

    //監聽發送的sdp事件
    socket.on('sdp', (data) => {
        //如果是offer類型的sdp
        if (data.description.type === 'offer') {
            //那麼被呼叫者需要開啟RTC的一套流程，同時不需要createOffer，所以第二個參數為false
            StartCall(data.sender, false);
            //把發送者(offer)的描述，存儲在接收者的remoteDesc中。
            let desc = new RTCSessionDescription(data.description);
            //按1-13流程走的
            pc[data.sender].setRemoteDescription(desc).then(() => {

                pc[data.sender].createAnswer().then((answer) => {
                    return pc[data.sender].setLocalDescription(answer);
                }).then(() => {
                    socket.emit('sdp', {
                        type: 'video-answer',
                        description: pc[data.sender].localDescription,
                        to: data.sender,
                        sender: socket.id
                    });

                }).catch();//catch error function empty

            })
        } else if (data.description.type === 'answer') {
            //如果使answer類消息（那麼接收到這個事件的是呼叫者）
            let desc = new RTCSessionDescription(data.description);
            pc[data.sender].setRemoteDescription(desc);
        }
    })

    //如果是ice candidates的協商信息
    socket.on('ice candidates', (data) => {
        console.log('ice candidate: ' + data.candidate);
        //{ candidate: candidate, to: partnerName, sender: socketID }
        //如果ice candidate非空（當candidate為空時，那麼本次協商流程到此結束了）
        if (data.candidate) {
            var candidate = new RTCIceCandidate(data.candidate);
            //講對方發來的協商信息保存
            pc[data.sender].addIceCandidate(candidate).catch();//catch err function empty
        }
    })


});
