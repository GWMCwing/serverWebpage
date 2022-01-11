//TODO change the active class
contentnameToPath = {
	facebookRC: '/html/cssRecreation/facebookRC.html',
	instgramRC: '/html/cssRecreation/instgramRC.html',
	twitterRC: '/html/cssRecreation/twitterRC.html',
	FileShare: '/html/main/fileShare.html',
};
function changeContent(contentName, id) {
	path = contentnameToPath[contentName];
	if (path) {
		$('#content').load(path);
	} else console.warn('no path for ' + contentName);
}
