contentnameToPath = {
	facebookRC: '/html/cssRecreation/facebookRC.html',
	instgramRC: '/html/cssRecreation/instgramRC.html',
	twitterRC: '/html/cssRecreation/twitterRC.html',
	login: '/html/login.html',
};
function changeContent(contentName) {
	path = contentnameToPath[contentName];
	if (path) $('#content').load(path);
	else console.warn('no path for ' + contentName);
}
