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

function setupViewRequestHandler(showViewCb, menuInfo) {
	async function showView(searchText, pushState) {
		const params = new URLSearchParams(searchText);
		const primary = menuInfo.primary;
		if (primary.default && !params.has(primary.key)) {
			params.set(primary.key, primary.default);
		}
		const secondary = menuInfo.secondary;
		if (secondary && secondary.default && !params.has(secondary.key)) {
			params.set(secondary.key, secondary.default);
		}

		const viewTitle = await showViewCb(params);

		{
			const menuPrimary = document.getElementById('menu-primary');
			const newParams = new URLSearchParams();
			if (secondary && params.has(secondary.key)) {
				newParams.set(secondary.key, params.get(secondary.key));
			}
			let currentValue = params.get(primary.key);
			if (currentValue) {
				currentValue = currentValue.toLowerCase();
			}
			for (let i = 0; i < menuPrimary.children.length; i++) {
				const value = primary.values[i].value;
				newParams.set(primary.key, value);
				newParams.sort();
				const navLink = menuPrimary.children[i];
				navLink.setAttribute('href', `?${newParams.toString()}`);
				navLink.className = (value == currentValue) ? 'nav-link active' : 'nav-link';
			}
		}

		if (secondary) {
			const menuSecondary = document.getElementById('menu-secondary');
			const newParams = new URLSearchParams();
			if (params.has(primary.key)) {
				newParams.set(primary.key, params.get(primary.key));
			}
			let currentValue = params.get(secondary.key);
			if (currentValue) {
				currentValue = currentValue.toLowerCase();
			}
			for (let i = 0; i < menuSecondary.children.length; i++) {
				const value = secondary.values[i].value;
				newParams.set(secondary.key, value);
				newParams.sort();
				const navLink = menuSecondary.children[i];
				navLink.setAttribute('href', `?${newParams.toString()}`);
				navLink.className = (value == currentValue) ? 'nav-link active' : 'nav-link';
			}
		}

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
			let html = '';
			html += '<div class="container-fluid flex-wrap">';

			html += '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#collapsibleNavbar">';
			html += '<span class="navbar-toggler-icon"></span>';
			html += '</button>';

			html += '<div class="collapse navbar-collapse" id="collapsibleNavbar">';
			// primary menu
			{
				html += '<div id="menu-primary" class="navbar-nav flex-row flex-wrap">';
				for (const value of menuInfo.primary.values) {
					html += `<a class="nav-link" href="?">${value.displayText}</a>`;
				}
				html += '</div>';
			}

			// secondary menu
			if (menuInfo.secondary) {
				html += '<div id="menu-secondary" class="navbar-nav flex-row flex-wrap ms-auto">';
				for (const value of menuInfo.secondary.values) {
					html += `<a class="nav-link" href="?">${value.displayText}</a>`;
				}
				html += '</div>';
			}

			html += '</div>';

			html += '</div>';

			const menu = document.getElementById('menu');
			menu.innerHTML = html;
		}

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
