var express = require('express');
var router = express.Router();
const path = require('path');
const pathToViews = path.join(__dirname, '../views');
/* GET home page. */
router.get('/', function (req, res, next) {
	res.sendFile(pathToViews + '/html/welcome.html');
});

module.exports = router;
