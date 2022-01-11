var express = require('express');
var hash = require('pbkdf2-password')();
var router = express.Router();
const path = require('path');
const pathToViews = path.join(__dirname, '../views');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
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
// testing
var users = {
	tj: {
		name: 'tj',
	},
};

hash({ password: 'foobar' }, function (err, pass, salt, hash) {
	if (err) throw err;
	users.tj.hash = hash;
	users.tj.salt = salt;
});

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
		cb(null, file.originalname + '-' + Date.now() + path.extname(file.originalname));
	},
});
const upload = multer({ storage: storage });
router.post('/upload', upload.array('files'), function (req, res) {
	// router.post('/upload', multer().fields([]), function (req, res) {
	console.log(req.files, req.body);

	//
	// create id folder (time stamp ?)
	// loop through the filePath
	// split the filePath /
	// for each subPath create dir if not exist
	// move the file to the dir if the subPath is the last one i.e. the file name
	//
	// response: id as cookie
	//
	let id = crypto.randomBytes(8).toString('hex');
	while (fs.existsSync('./public/uploads/' + id)) {
		id = crypto.randomBytes(8).toString('hex');
	}
	fs.mkdirSync('./public/uploads/' + id);

	for (let i = 0; i < req.files.length; i++) {
		let localFilePath = req.body.filePath[i].split('/');
		localFilePath.pop();
		if (!fs.existsSync('./public/uploads/' + id + '/' + localFilePath.join('/'))) {
			fs.mkdirSync('./public/uploads/' + id + '/' + localFilePath.join('/'));
		}
		fs.rename(
			'./public/uploads/temp/' + req.files[i].filename,
			'./public/uploads/' + id + '/' + req.body.filePath[i],
			(err) => {
				if (err) throw err;
			}
		);
		//
	}
	//TODO response id as cookie and update the page with the id
	res.send('uploaded');
});
module.exports = router;
