var express = require('express');
var hash = require('pbkdf2-password')();
var router = express.Router();
const fs = require('fs');
// authendication
var users;
fs.readFile('./bin/config.json', 'utf8', function (err, data) {
	if (err) throw err;
	users = JSON.parse(data).users;
});

function authenticate(name, pass, fn) {
	if (!module.main) console.log('authenticating %s:%s', name, pass);
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

module.exports = router;
