var HTMLPreview = {

	content: '',

	previewform: document.getElementById('previewform'),

	file: function() {
		return location.search.substring(1); //Get everything after the ?
	},

	raw: function() {
		return HTMLPreview.file().replace(/\/\/github\.com/, '//raw.github.com').replace(/\/blob\//, '/'); //Get URL of the raw file
	},

	replaceAssets: function() {
		var link, script, frame, a, i, href, src;
		link = document.getElementsByTagName('link');
		for(i = 0; i < link.length; ++i) {
			if(link[i].rel
			&& link[i].rel.toLowerCase() == 'stylesheet'
			&& link[i].href) {
				href = link[i].href; //Get absolute URL
				if(href.indexOf('//raw.github.com') > 0 || href.indexOf('//bitbucket.org') > 0) { //Check if it's from raw.github.com or bitbucket.org
					HTMLPreview.send(href, 'loadCSS'); //Then load it using YQL
				}
			}
		}
		script = document.getElementsByTagName('script');
		for(i = 0; i < script.length; ++i) {
			if(script[i].src) {
				src = script[i].src; //Get absolute URL
				if(src.indexOf('//raw.github.com') > 0 || src.indexOf('//bitbucket.org') > 0) { //Check if it's from raw.github.com or bitbucket.org
					HTMLPreview.send(src, 'loadJS'); //Then load it using YQL
				}
			}
		}
		frame = [].concat.apply([].concat.apply([], document.getElementsByTagName("iframe")), document.getElementsByTagName("frame"));
		for(i = 0; i < frame.length; ++i) {
			if(frame[i].src) {
				src = frame[i].src; //Get absolute URL
				if(src.indexOf('//raw.github.com') > 0 || src.indexOf('//bitbucket.org') > 0) { //Check if it's from raw.github.com or bitbucket.org
					frame[i].src = 'http://' + location.hostname + location.pathname + '?' + src; //Then rewrite URL so it can be loaded using YQL
				}
			}
		}
		a = document.getElementsByTagName('a');
		for(i = 0; i < a.length; ++i) {
			if(a[i].href) {
				href = a[i].href; //Get absolute URL
				if(href.indexOf('#') > 0) { //Check if it's an anchor
					a[i].href = 'http://' + location.hostname + location.pathname + location.search + '#' + a[i].hash.substring(1); //Then rewrite URL with support for empty anchor
				}
				else if(href.indexOf('//raw.github.com') > 0 || href.indexOf('//bitbucket.org') > 0) { //Check if it's from raw.github.com or bitbucket.org
					a[i].href = 'http://' + location.hostname + location.pathname + '?' + href; //Then rewrite URL so it can be loaded using YQL
				}
			}
		}
	},

	loadHTML: function(data) {
		if(data
		&& data.query
		&& data.query.results
		&& data.query.results.resources
		&& data.query.results.resources.content
		&& data.query.results.resources.status == 200) {
			HTMLPreview.content = data.query.results.resources.content.replace(/<head>/i, '<head><base href="' + HTMLPreview.raw() + '">').replace(/<\/body>/i, '<script src="http://' + location.hostname + '/htmlpreview.min.js"></script><script>HTMLPreview.replaceAssets();</script></body>').replace(/<\/head>\s*<frameset/gi, '<script src="http://' + location.hostname + '/htmlpreview.min.js"></script><script>document.write("<scr"+"ipt>HTMLPreview.replaceAssets();</scr"+"ipt>");</script></head><frameset'); //Add <base> just after <head> and inject <script> just before </body> or </head> if <frameset>
			setTimeout(function() {
				document.open();
				document.write(HTMLPreview.content);
				document.close();
			}, 50); //Delay updating document to have it cleared before
		}
		else if(data
			&& data.error
			&& data.error.description) {
			HTMLPreview.previewform.innerHTML = data.error.description;
		}
		else
			HTMLPreview.previewform.innerHTML = 'Error: Cannot load file ' + HTMLPreview.raw();
	},

	loadCSS: function(data) {
		if(data
		&& data.query
		&& data.query.results
		&& data.query.results.resources
		&& data.query.results.resources.content
		&& data.query.results.resources.status == 200) {
			document.write('<style>' + data.query.results.resources.content.replace(/url\((?:'|")?([^\/][^:'"\)]+)(?:'|")?\)/gi, 'url(' + data.query.results.resources.url.replace(/[^\/]+\.css.*$/gi, '') + '$1)') + '</style>'); //If relative URL in CSS background-image property, then concatenate URL to CSS directory
		}
	},

	loadJS: function(data) {
		if(data
		&& data.query
		&& data.query.results
		&& data.query.results.resources
		&& data.query.results.resources.content
		&& data.query.results.resources.status == 200) {
			document.write('<script>' + data.query.results.resources.content + '</script>');
		}
	},

	send: function(file, callback) {
		document.write('<script src="http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20data.headers%20where%20url%3D%22' + encodeURIComponent(file) + '%22&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=HTMLPreview.' + callback + '"></script>'); //Get content using YQL
	},

	submitform: function() {
		location.href = '/?' + document.getElementById('file').value;
		return false;
	},

	init: function() {
		HTMLPreview.previewform.onsubmit = HTMLPreview.submitform;
		if(HTMLPreview.file()) {
			HTMLPreview.previewform.innerHTML = '<p>Loading...</p>';
			HTMLPreview.send(HTMLPreview.raw(), 'loadHTML');
		}
	}
}
