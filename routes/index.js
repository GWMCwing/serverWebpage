//TODO create a dedicated logging function with the following format:
// [type] [time] [message]
//TODO add color to the log
var express = require('express');
var router = express.Router();
const path = require('path');
const pathToViews = path.join(__dirname, '../views');
/* GET home page. */
router.get('/', function (req, res, next) {
	res.sendFile(pathToViews + '/html/main/main.html');
});
router.get('/html/:dir/:htmlName', function (req, res, next) {
	res.sendFile(pathToViews + '/html/' + req.params.dir + '/' + req.params.htmlName);
});
router.get('/test/:target', function (req, res, next) {
	res.sendFile(pathToViews + '/htmlNew/' + req.params.target + '/' + req.params.target);
});
router.get('/test/footer', function (req, res, next) {
	res.sendFile(pathToViews + '/htmlNew/template/footer');
});

router.get('/test/navBar', function (req, res, next) {
	res.sendFile(pathToViews + '/htmlNew/template/navBar');
});
//
//

module.exports = router;
