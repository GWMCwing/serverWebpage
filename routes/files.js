var express = require('express');
var router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const archiver = require('archiver');

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
//TODO change this to recursion with depth 4
async function getFileStructureAsync(path) {
	let fileStructure = {};
	fs.readdirSync(path).forEach((id) => {
		if (id == 'zip' || id == 'temp' || id.includes('.')) {
		} else {
			fileStructure[id] = [];
			fs.readdirSync(path + '/' + id).forEach((fileName) => {
				// files in id folder
				if (fs.statSync(path + '/' + id + '/' + fileName).isDirectory()) {
					// if the file is a directory
					fs.readdirSync(path + '/' + id + '/' + fileName).forEach((file2) => {
						fileStructure[id].push(fileName + '/' + file2);
					});
				} else {
					fileStructure[id].push(fileName);
				}
			});
		}
	});
	return fileStructure;
}
/**
 *
 * @param {integer} path
 * @param {integer} depth
 * @param {Object} fileList
 * {fileList:[
 * 	dir1Name:[
 * 	file2Name,
 * 	dir2Name:[]
 * 	],
 * 	file1Name
 * ]}
 */
function getFileStructureSync(path, depth, fileList) {
	if (count == 0) {
		if (!fs.statSync(path)) return false;
	}
	if (depth == 0) {
	} else {
	}
}

router.post('/fileList', function (req, res, next) {
	let uploadIdPath = './public/uploads/';
	getFileStructureAsync(uploadIdPath)
		.then((fileStructure) => {
			console.log(fileStructure);
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify(fileStructure, null, 2));
			console.log('sent file list: ' + fileStructure);
		})
		.catch((err) => {
			console.log(err);
			res.send('error occured');
			return;
		});
});
module.exports = router;
