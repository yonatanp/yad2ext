console.log("content.js started")


$(document).on('click', '.ad_favorite', function(event) {
	return star_click(event);
});

$(document).on('contextmenu', '.ad_favorite', function(event) {
	return star_right_click(event);
});

$(document).on('contextmenu', '.ad_favorite', function(event) {
	return star_right_click(event);
});

$(document).on('dblclick', '.ad_favorite', function(event) {
	return star_dblclick(event);
});


// these are the defaults in case nothing is stored in sync storage.
options = {
	hide_blacklist: true,
};

function load_options(callback) {
	chrome.storage.sync.get(null, function(items) {
		for (var key in items) {
			if (key.match("options_")) {
				const member = key.split("options_")[1];
				options[member] = items[key];
			}
		}
		callback();
	});
	$(document)
}

function monitor_options_change() {
	chrome.storage.onChanged.addListener(function(changes, namespace) {
		options_changed = false;
		for (key in changes) {
			if (namespace == "sync" && key.match("options_")) {
				const member = key.split("options_")[1];
				const storageChange = changes[key];
				options[member] = storageChange.newValue;
				options_changed = true;
				console.log('options changed: %s was %s and now %s', member, storageChange.oldValue, storageChange.newValue);
			}
		}
		if (options_changed) {
			apply_options();
		}
	});
};

function apply_options() {
	showhide_blacklist_ad($('.star'));
}

function showhide_blacklist_ad(star) {
	bl_rows = star.filter(".star-blacklist").closest("tr[id^=tr_Ad]");
	if (options.hide_blacklist) {
		bl_rows.fadeOut();
	}
	else {
		bl_rows.fadeIn();
	}
}

// load and start monitoring
load_options(monitor_options_change);

$(document).on('star-class-changed', '.star', function(event) {
	showhide_blacklist_ad($(event.target));
});


// the 90's keep calling my web browser
function monitor_appearance(selector, callback) {
	setInterval(function() {
	    $(selector+':not(.appeared)')
	        .addClass('appeared')
	        .each(callback);
	}, 250);
}

monitor_appearance('.ad_favorite', function() {
	const star = $(this);
	console.log('star_appeared', star);
	if (! star.hasClass('star')) {
		star.addClass('star');
		on_new_star_appeared(star);
	}
	update_star_appearance(star);
})

function on_new_star_appeared(star) {
	// ...
}

function update_star_appearance(star) {
	var y = star.attr('id').split('_');
	var ad_number = y[y.length-1];
	console.log('updating visual star for ad number ' + ad_number);
	// TODO: do this with CSS instead!
	ad_prop_get(ad_number, function(prop) {
		if (prop['favorite'] == true) {
			// star-favorite (deep blue)
			set_star_class(star, 'favorite');
		}
		else if (prop['blacklist'] == true) {
			// star-blacklist (black)
			set_star_class(star, 'blacklist');
		}
		else if (prop['seen'] == true) {
			// star-not-impressed (grey)
			set_star_class(star, 'seen');
		}
		else {
			// star-unseen (q. mark)
			set_star_class(star, 'unseen');
		}
	});
}

function set_star_class(star, class_name) {
	star.fadeOut('fast', function() {
		star.removeClass('star-favorite');
		star.removeClass('star-blacklist');
		star.removeClass('star-seen');
		star.removeClass('star-unseen');
		star.addClass('star-' + class_name);
		star.fadeIn('fast');
		star.trigger("star-class-changed");
	});
}


// star mouse events

function star_click(event) {
	const clickedElement = $(event.target);
	var y = clickedElement.attr('id').split('_');
	var ad_number = y[y.length-1];
	console.log('star clicked for ad number %s', ad_number);

	ad_toggle_favorite(ad_number, function(new_prop) {
		update_star_appearance(clickedElement);
	});

	return false;
}

function star_right_click(event) {
	const clickedElement = $(event.target);
	var y = clickedElement.attr('id').split('_');
	var ad_number = y[y.length-1];
	console.log('star right-clicked for ad number %s', ad_number);

	ad_toggle_seen(ad_number, function(new_prop) {
		update_star_appearance(clickedElement);
	});

	return false;
}

function star_dblclick(event) {
	const clickedElement = $(event.target);
	var y = clickedElement.attr('id').split('_');
	var ad_number = y[y.length-1];
	console.log('star dbl-clicked for ad number %s', ad_number);

	ad_toggle_blacklist(ad_number, function(new_prop) {
		update_star_appearance(clickedElement);
	});

	return false;
}


function ad_favorite(ad_id) {
	ad_prop_set(ad_id, {
		favorite: true,
		blacklist: false,
	});
}

function ad_toggle_favorite(ad_id, on_complete) {
	ad_prop_modify(ad_id, function(prop) {
		if (prop['favorite'] == true) {
			prop['favorite'] = false;
		}
		else {
			prop['favorite'] = true;
			prop['blacklist'] = false;
		}
		return prop;
	}, on_complete)
}

function ad_blacklist(ad_id) {
	ad_prop_set(ad_id, {
		favorite: false,
		blacklist: true,
	});
}

function ad_toggle_seen(ad_id, on_complete) {
	ad_toggle_field(ad_id, 'seen', on_complete);
}

function ad_toggle_blacklist(ad_id, on_complete) {
	ad_toggle_field(ad_id, 'blacklist', on_complete);
}

function ad_toggle_field(ad_id, field, on_complete) {
	ad_prop_modify(ad_id, function(prop) {
		if (prop[field] == true) {
			prop[field] = false;
		}
		else {
			prop[field] = true;
		}
		return prop;
	}, on_complete)
}

function ad_prop_get(ad_id, handler) {
	var ad_key = "ad-" + ad_id;
	chrome.storage.sync.get([ad_key], function(items) {
	    window.items = items;
	    prop = items[ad_key];
	    console.log("ad_prop_get: prop for %s is", ad_key, prop);
	    if (prop == undefined) {
	    	prop = {};
	    }
	    handler(prop);
	});
}

function ad_prop_modify(ad_id, modifier, on_complete) {
	ad_prop_get(ad_id, function(prop) {
		var ad_key = "ad-" + ad_id;
	    console.log("ad_prop_modify: prop for %s before update is", ad_key, prop);
	    var new_prop = modifier(prop);
	    console.log("ad_prop_modify: prop for %s after update is", ad_key, prop);
	    chrome.storage.sync.set({[ad_key]: new_prop }, function(){
		    console.log("ad_prop_modify: prop update for %s done", ad_key);
		    on_complete(new_prop);
		});
	});
}

function ad_prop_set(ad_id, prop_dict, on_complete) {
	ad_prop_modify(ad_id, function(prop) {
		return Object.assign({}, prop, prop_dict);
	}, on_complete)
}


// add some control elements
$("body").append($('<a href="#" class="opt-toggle">toggle view blacklist</a>').click(function() {
	chrome.storage.sync.get(['options_hide_blacklist'], function(items) {
	    chrome.storage.sync.set({options_hide_blacklist: !items['options_hide_blacklist']});
	});
	return false;
}));



console.log("content.js done")
