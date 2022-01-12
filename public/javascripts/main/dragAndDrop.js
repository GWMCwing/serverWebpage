const dropArea = document.getElementById('drop-area');
//
const localFileList = document.getElementById('localFileList');
//
const dragTextDiv = document.getElementById('dragDropTextDiv');
const input = document.getElementById('inputFile');
const browseFileButton = document.getElementById('browseButton');
const sendFileButton = document.getElementById('sendFileButton');
const uploadProgressBar = document.getElementById('uploadProgressBar');
//
var fileList = {};
//

browseFileButton.onclick = () => {
	input.click();
};
function updateLocalFileList() {
	//
	for (let fileName in fileList) {
		let li = document.createElement('li');
		// li.textContent = fileName;
		li.innerHTML = `<p>${fileName}</p>`;
		li.classList.add('LocalFileListItem');
		localFileList.appendChild(li);
	}
}
input.addEventListener('change', () => {
	console.log(input.files);
	fileList = {};
	for (let file of input.files) {
		fileList[file.name] = file;
	}
	updateLocalFileList();
});
//
dropArea.addEventListener(
	'dragover',
	function (e) {
		e.preventDefault();
		e.stopPropagation();
		this.classList.add('dragActive');
	},
	false
);

dropArea.addEventListener(
	'dragleave',
	function (e) {
		e.preventDefault();
		e.stopPropagation();
		this.classList.remove('dragActive');
	},
	false
);

function traverseFileTree(item, path) {
	path = path || '';
	if (item.isFile) {
		//Get file
		item.file((file) => {
			console.log(path + file.name);
			fileList[path + file.name] = file;
		});
	} else if (item.isDirectory) {
		var dirReader = item.createReader();
		dirReader.readEntries((entries) => {
			for (var i = 0; i < entries.length; i++) {
				traverseFileTree(entries[i], path + item.name + '/');
			}
		});
	}
}

dropArea.addEventListener(
	'drop',
	function (e) {
		e.preventDefault();
		e.stopPropagation();
		this.classList.remove('dragActive');
		const dt = e.dataTransfer;
		var items = dt.items;
		fileList = {};
		for (var i = 0; i < items.length; i++) {
			var item = items[i].webkitGetAsEntry();
			if (item) {
				traverseFileTree(item);
			}
		}
		updateLocalFileList();
	},
	false
);
//
//! server attach id
sendFileButton.onclick = () => {
	let xhr = new XMLHttpRequest();
	xhr.open('POST', '/upload');
	xhr.onload = () => {
		if (xhr.status === 200) {
			console.log('all done' + xhr.status);
		} else {
			console.log('something went wrong' + xhr.status);
		}
	};

	var fileFormData = new FormData();
	for (let filePath in fileList) {
		console.log(filePath);
		fileFormData.append('files', fileList[filePath], filePath);
		fileFormData.append('filePath', filePath);
	}
	console.log(...fileFormData);
	xhr.send(fileFormData);

	xhr.upload.onprogress = (event) => {
		if (event.lengthComputable) {
			let percent = (event.loaded / event.total) * 100;
			uploadProgressBar.value = percent;
		}
	};
	xhr.onload = () => {
		uploadProgressBar.value = 100;
	};
};
