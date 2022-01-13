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
			req.session.error =
				'Authentication failed, please check your ' + ' username and password.' + ' (use "tj" and "foobar")';
			res.redirect('/login');
		}
	});
});
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
	console.log(req.files, req.body);

	let id = crypto.randomBytes(8).toString('hex');
	while (fs.existsSync('./public/uploads/' + id)) {
		id = crypto.randomBytes(8).toString('hex');
	}
	fs.mkdirSync('./public/uploads/' + id);
	moveUploadTemp(req, id)
		.then(() => {
			res.cookie('id', id);
			res.send(id);
		})
		.catch((err) => {
			console.log(err);
		});
	// res.send('uploaded');
});
//
//
function createZip(id, oriFilePath) {
	fs.mkdirSync('./public/uploads/zip/' + id, { recursive: true });
	let errorOccured = false;
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
	return errorOccured;
}
router.post('/download', function (req, res, next) {
	let id = req.body.id;
	let name = req.body.nameOfFile || id;
	let oriFilePath = './public/uploads/' + id + '/';
	let errOccured = false;
	if (!fs.existsSync(oriFilePath)) {
		res.send('error');
		return;
	}
	if (!fs.existsSync('./public/uploads/zip/' + id)) {
		errOccured = createZip(id, oriFilePath);
	}
	if (errOccured) {
		res.send('error occured');
	} else {
		res.download('./public/uploads/zip/' + id + '.zip', name + '.zip');
	}
	//
});

module.exports = router;
