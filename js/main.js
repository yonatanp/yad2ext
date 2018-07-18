/*
** file: js/main.js
** description: javascript code for "html/main.html" page
*/

function init_main () {
    $('html').hide().fadeIn('slow');

    $('#yad2ext_state_export_btn').click(function() {
    	console.log('--clicked export');
  //   	chrome.storage.sync.get(["yptest"], function(items){
		//     //  items = [ { "yourBody": "myBody" } ]
		//     console.log("data fetched: " + items);
		//     window.myitems = items;
		// });
		chrome.storage.sync.get(null, function(items) {
			console.log("everything: " + items);
			window.everything = items;
			$("textarea#yad2ext_state_export").val(JSON.stringify(everything));
		});
    })

    $('#yad2ext_state_import_btn').click(function() {
    	console.log('--clicked import');
    	chrome.storage.sync.clear(function() {
    		console.log('--cleared!!!');
			const state_str = $("textarea#yad2ext_state_import").val();
			const state = JSON.parse(state_str);
			window.state_import = state;
			chrome.storage.sync.set(state, function() {
				$("textarea#yad2ext_state_import").val("state imported");
			});
    	})
    })
}

//bind events to dom elements
document.addEventListener('DOMContentLoaded', init_main);