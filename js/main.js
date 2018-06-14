/*
** file: js/main.js
** description: javascript code for "html/main.html" page
*/

function init_main () {
    $('html').hide().fadeIn('slow');
    $('html').click(function() {
    	console.log('--clicked');
    	chrome.storage.sync.get(["yptest"], function(items){
		    //  items = [ { "yourBody": "myBody" } ]
		    console.log("data fetched: " + items);
		    window.myitems = items;
		});
		chrome.storage.sync.get(null, function(items){
			console.log("everything: " + items);
			window.everything = items;
			$("textarea#yad2ext_state").val(JSON.stringify(everything));
		});
    })
}

//bind events to dom elements
document.addEventListener('DOMContentLoaded', init_main);