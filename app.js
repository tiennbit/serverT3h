var express = require("express");
var app = express();

var server = require("http").Server(app);
var io = require("socket.io")(server);
var fs = require("fs");

var usernames = [];
var list_socketid = [];
var users = [];
var users_dto = [];

// var user_1 = {
// 	username: "tuannguyen",
// 	password: 000000
// };

// usernames.push(user_1.username);
// users.push(user_1);

// var user_2 = {
// 	username: "tuannguyen1",
// 	password: 111111
// };

// usernames.push(user_2.username);
// users.push(user_2);


server.listen(3000);
console.log("Server Running!");

app.get("/", function(req, res){
	res.sendFile(__dirname + "/index.html")
});

io.sockets.on('connection', function(socket){
	console.log("co thiet bi ket noi den");

	//# Nhận thông tin đăng kí
	socket.on('client-send-register', function(user){
		if(usernames.indexOf(user.username) >= 0){
			console.log("Tai khoan da ton tai!");
			//## Gửi kết quả fail về client
			socket.emit('server-send-register-fail', {result: false});
			return;
		}
		console.log(user);
		console.log(user.username + " da dang ki thanh cong");
		console.log("socket id_register: "+ socket.id);
		//## Gửi kết quả đk thành công
		socket.emit('server-send-register-success', {result: true});
		usernames.push(user.username);
		list_socketid.push(socket.id);

		user_ = {
			username: user.username,
			password: user.password,
		}
		users.push(user_);

		fs.writeFile("images/" + user.username + ".png", user.image);

		var us = {
			username: user.username,
			image: user.image,
		}

		users_dto.push(us);
	});

	//# Nhận login từ client
	socket.on('client-send-login', function(user){
		var index = usernames.indexOf(user.username);
		if(index == -1){
			//## gửi kết quả là k tồn tại tài khoản
			socket.emit('server-send-not-user', {result: false});
			console.log("Tai khoan khong ton tai!")
			console.log(users.length);
		}else{
			if(users[index].password == user.password){
				//## gửi kết quả đăng nhập thành công
				socket.emit('server-send-login-success', {result: true});
				console.log(user.username+" Dang nhap thanh cong!");
				list_socketid[index] = socket.id;
			}else{
				//## gửi kết quả là sai mật khẩu
				socket.emit('server-send-wrong-password', {result: false});
				console.log("Sai mat khau!");
			}
		}
	});

	//# Nhận sự kiện getUsers
	socket.on('client-get-users', function(data){
		socket.emit('server-send-users', {users: users_dto});
	});

	//# Nhận sự kiện client tìm bạn
	socket.on('client-find-user', function(username){
		if(usernames.indexOf(username) >= 0){
			socket.emit('server-has-user', {result: true});
			console.log("Co tai khoan!");
		}else{
			socket.emit('server-has-not-user', {result: false});
			console.log("Tai Khoan khong ton tai");
		}
	});
	//# Nhận request Friend
	socket.on('client-send-request-friend', function(username){
		var index_1 = list_socketid.indexOf(socket.id);
		console.log("yeu cau ket ban!");
		//gui request nay ve nguoi kia
		var index_2 = usernames.indexOf(username);
		io.to(list_socketid[index_2]).emit('server-send-request-friend', {username: usernames[index_1]});
	});

	//# Nhận message từ client
	socket.on('client-send-message', function(message){
		console.log(message);
		var index = list_socketid.indexOf(socket.id);
		//### Gui ve chinh minh
		var data = {
			sender: "You",
			message: message
		}
		socket.emit('server-send-message', data);

		//### Gui ve cac client khac
		var data = {
			sender: usernames[index],
			message: message
		}
		socket.broadcast.emit('server-send-message', data);

	});
});

