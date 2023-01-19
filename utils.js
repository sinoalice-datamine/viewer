"use strict;"

//--------------
// HTTP request

function asyncRequest(method, url) {
	return new Promise(function(resolve, reject) {
		let xhr = new XMLHttpRequest();
		xhr.open(method, url, true);
		xhr.onload = function() {
			if (this.status >= 200 && this.status < 300) {
				resolve(xhr.response);
			} else {
				reject({
					status: this.status,
					statusText: xhr.statusText
				});
			}
		};
		xhr.onerror = function() {
			reject({
				status: this.status,
				statusText: xhr.statusText
			});
		};
		xhr.send();
	});
}

async function loadJson(cache, url) {
	let json = cache.get(url);
	if (json) {
		return json;
	}

	let response = await asyncRequest("GET", url);
	json = JSON.parse(response);
	cache.set(url, json);
	return json;
}

//---------------
// JSONP request

jsonpResult = null;
function jsondata(obj) {
	jsonpResult = obj;
}

function asyncRequestJsonp(url) {
	return new Promise(function(resolve, reject) {
		let s = document.createElement("script");
		s.src = url;
		s.addEventListener("load", function() {
			let res = jsonpResult;
			jsonpResult = null;
			document.body.removeChild(s);
			resolve(res);
		});
		document.body.appendChild(s);
	});
}

async function loadJsonp(cache, url) {
	let json = cache.get(url);
	if (json) {
		return json;
	}

	json = await asyncRequestJsonp(url);
	cache.set(url, json);
	return json;
}

//---------------
// persistent navigation

function setupViewRequestHandler(showViewCb) {
	async function showView(searchText, pushState) {
		const viewTitle = await showViewCb(searchText);

		const content = document.getElementById('content');
		const links = content.querySelectorAll('a');
		for (let i = 0; i < links.length; i++) {
			const link = links[i];
			if (link.getAttribute('href').startsWith('?'))
				link.addEventListener('click', onLinkClick);
		}

		if (pushState) {
			history.pushState({}, '', searchText);
		}
		document.title = viewTitle;
	}

	function onLinkClick(event) {
		event.preventDefault();
		showView(event.target.getAttribute('href'), true);
	}

	function onDocumentLoad(event) {
		{
			const navs = document.getElementsByTagName('nav');
			for (let i = 0; i < navs.length; i++) {
				const links = navs[i].querySelectorAll('a');
				for (let j = 0; j < links.length; j++) {
					const link = links[j];
					if (link.getAttribute('href').startsWith('?'))
						link.addEventListener('click', onLinkClick);
				}
			}
		}

		showView(document.location.search, false);
	}

	function onPopState(event) {
		showView(document.location.search, false);
	}

	window.addEventListener('load', onDocumentLoad);
	window.addEventListener('popstate', onPopState);
}
