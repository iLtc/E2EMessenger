let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);

let sockets = {};
let id2sockets = {};
let available_ids = [];

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    console.log(socket.id + ' connected');

    sockets[socket.id] = socket;

    var id = null;
    while(true) {
        id = Math.floor(Math.random() * 900000) + 100000;

        if (id2sockets[id] === undefined) {
            break
        }
    }

    available_ids.push(id);
    id2sockets[id] = socket.id;

    socket.emit('receiver id', id);

    socket.on('disconnect', function(){
        console.log(socket.id + ' disconnected');

        delete sockets[socket.id];

        let id = findValueByIndex(id2sockets, socket.id);

        removeValueFromArray(available_ids, id);

        delete id2sockets[id];
    });

    socket.on('sender connect request', function (temp_id) {
        let id = parseInt(temp_id);

        if (isNaN(id)) {
            socket.emit('sender connect response', {'status': 'failed', 'msg': 'Receiver ID should be a number!'});
            return;
        }

        if (available_ids.indexOf(id) === -1) {
            socket.emit('sender connect response', {'status': 'failed', 'msg': 'Receiver ID is not available!'});
            return;
        }

        let sender_id = findValueByIndex(id2sockets, socket.id);

        sockets[id2sockets[id]].emit('receiver connect request', {'senderId': sender_id});
    });

    socket.on('receiver connect response', function (data) {
        let id = parseInt(data['id']);
        sockets[id2sockets[id]].emit(
            'sender connect response',
            {
                'status': 'success',
                'isConfirm': data['confirm'],
                'receiverId': findValueByIndex(id2sockets, socket.id)
            }
        );
    });

    socket.on('send msg', function (data) {
        let id = parseInt(data['id']);
        sockets[id2sockets[id]].emit(
            'receive msg',
            {
                'msg': data['msg']
            });
    })
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});

let findValueByIndex = function (obj, value) {
    for (let key in obj) {
        if (obj[key] === value) {
            return key;
        }
    }
};

let removeValueFromArray = function (arr, val) {
    let i = arr.indexOf(val);

    if (i > -1) {
        arr.splice(i, 1);
    }
};