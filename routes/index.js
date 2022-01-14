//TODO create a dedicated logging function with the following format:
// [type] [time] [message]
//TODO add color to the log
var express = require('express');
var hash = require('pbkdf2-password')();
var router = express.Router();
const path = require('path');
const pathToViews = path.join(__dirname, '../views');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const archiver = require('archiver');
/* GET home page. */
router.get('/', function (req, res, next) {
	res.sendFile(pathToViews + '/html/main/main.html');
});
router.get('/html/:dir/:htmlName', function (req, res, next) {
	res.sendFile(pathToViews + '/html/' + req.params.dir + '/' + req.params.htmlName);
});
router.get('/test', function (req, res, next) {
	res.sendFile(pathToViews + '/html/main/test.html');
});

// authendication

var users;
fs.readFile('./bin/config.json', 'utf8', function (err, data) {
	if (err) throw err;
	users = JSON.parse(data).users;
});
// hash({ password: 'foobar' }, function (err, pass, salt, hash) {
// 	if (err) throw err;
// 	users.tj.hash = hash;
// 	users.tj.salt = salt;
// });

function authenticate(name, pass, fn) {
	if (!module.parent) console.log('authenticating %s:%s', name, pass);
	var user = users[name];
	if (!user) return fn(new Error('cannot find user'));
	hash({ password: pass, salt: user.salt }, function (err, pass, salt, hash) {
		if (err) return fn(err);
		if (hash === user.hash) return fn(null, user);
		fn(new Error('invalid password'));
	});
}

function restrict(req, res, next) {
	if (req.session.user) {
		next();
	} else {
		req.session.error = 'Access denied!';
		res.redirect('/login');
	}
}

router.get('/logout', function (req, res, next) {
	req.session.destroy(function () {
		res.redirect('/');
	});
});
router.get('/login', function (req, res, next) {
	res.sendFile(pathToViews + '/html/main/login.html');
});

router.post('/login', function (req, res) {
	authenticate(req.body.username, req.body.password, function (err, user) {
		if (user) {
			req.session.regenerate(function () {
				req.session.user = user;
				req.session.success =
					'Authenticated as ' +
					user.username +
					' click to <a href="/logout">logout</a>. ' +
					' You may now access <a href="/restricted">/restricted</a>.';
				res.redirect('/');
			});
		} else {
			req.session.error = 'Authentication failed, please check your ' + ' username and password.';
			res.redirect('/login');
			let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
			console.log('Tried to login as: ' + req.body.username);
			console.log('ip: ' + ip);
		}
	});
});

//
//

//files related
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, './public/uploads/temp');
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname + '-' + crypto.randomBytes(16).toString('hex') + path.extname(file.originalname));
	},
});

async function moveUploadTemp(req, id) {
	for (let i = 0; i < req.files.length; i++) {
		let localFilePath;
		if (typeof req.body.filePath === 'string') {
			localFilePath = req.body.filePath.split('/');
		} else {
			localFilePath = req.body.filePath[i].split('/');
		}
		let fileName = localFilePath.pop();
		console.log(localFilePath);
		console.log(fileName);
		if (!fs.existsSync('./public/uploads/' + id + '/' + localFilePath.join('/'))) {
			fs.mkdirSync('./public/uploads/' + id + '/' + localFilePath.join('/'), { recursive: true });
			console.log('created dir');
		}
		fs.rename(
			'./public/uploads/temp/' + req.files[i].filename,
			'./public/uploads/' + id + '/' + localFilePath.join('/') + '/' + fileName,
			(err) => {
				if (err) throw err;
			}
		);
		//
	}
}

const upload = multer({ storage: storage });
router.post('/upload', upload.array('files'), function (req, res) {
	// router.post('/upload', multer().fields([]), function (req, res) {
	console.log('Uploaded files:');
	console.log(req.files);
	console.log('From body:');
	console.log(req.body);
	if (req.files.length === 0) return;
	if (!fs.existsSync('./public/uploads/temp')) {
		fs.mkdirSync('./public/uploads/temp', { recursive: true });
	}
	let id = crypto.randomBytes(8).toString('hex');
	while (fs.existsSync('./public/uploads/' + id)) {
		id = crypto.randomBytes(8).toString('hex');
	}
	fs.mkdirSync('./public/uploads/' + id, { recursive: true });
	moveUploadTemp(req, id)
		.then(() => {
			res.cookie('id', id);
			res.send(id);
		})
		.catch((err) => {
			console.log(err);
			return;
		});
	if (!fs.existsSync('./public/uploads/fileStructure.json')) {
		fs.writeFileSync('./public/uploads/fileStructure.json', JSON.stringify({ uploads: {} }));
	}
	let fileStr = JSON.parse(fs.readFileSync('./public/uploads/fileStructure.json'));
	fileStr.uploads[id] = {
		time: new Date().getTime(),
	};

	console.log('uploaded id: ' + id);
});
//
//
function createZip(id, oriFilePath) {
	fs.mkdirSync('./public/uploads/zip/' + id, { recursive: true });
	let isErrorOccured = false;
	const output = fs.createWriteStream('./public/uploads/zip/' + id + '.zip');
	const archive = archiver('zip');
	//
	output.on('close', function () {
		console.log(archive.pointer() + ' total bytes');
		console.log('archiver has been finalized and the output file descriptor has closed.');
	});
	output.on('end', function () {
		console.log('Data has been drained');
	});
	archive.on('warning', function (err) {
		console.log(err);
		errOccured = true;
	});
	archive.on('error', function (err) {
		console.log(err);
		errOccured = true;
	});
	archive.directory(oriFilePath, id);
	archive.pipe(output);
	archive.finalize();
	return isErrorOccured;
}
router.post('/download', function (req, res, next) {
	let id = req.body.id;
	// let name = req.body.nameOfFile || id;
	let name = id;
	console.log('Trying to download ' + id + ' as ' + name);
	let oriFilePath = './public/uploads/' + id + '/';
	let errOccured = false;
	if (!fs.existsSync(oriFilePath)) {
		//TODO update the page to display error
		res.send('error id does not exists');
		return;
	}
	if (!fs.existsSync('./public/uploads/zip/' + id + '.zip')) {
		errOccured = createZip(id, oriFilePath);
	}
	if (errOccured) {
		//TODO update the page to display error
		res.send('error occured');
	} else {
		res.download('./public/uploads/zip/' + id + '.zip', name + '.zip');
	}
	//
});
// TODO
// save the fileList in a variable and send it to the client
// modify the file list per upload
router.post('/fileList', function (req, res, next) {
	let fileList = {};
	let uploadIdPath = './public/uploads/';
	fs.readdirSync(uploadIdPath).forEach((file) => {
		if (file == 'zip' || file == 'temp' || file.includes('.')) {
		} else {
			fileList[file] = [];
			if (fs.lstatSync(uploadIdPath + file).isDirectory()) {
				fs.readdirSync(uploadIdPath + file).forEach((file2) => {
					fileList[file].push(file2);
				});
			} else {
				fileList[file].push(file);
			}
		}
	});

	console.log(fileList);
	res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify(fileList, null, 2));
	console.log('sent file list: ' + fileList);
});
module.exports = router;
