console.log("inject_images.js loading")

monitor_appearance("div.ad_iframe", function() {
    console.log($(this));
    const iframe = $(this).find("iframe.ad_iframe");
    add_extra_content_into_iframe(iframe);
})

function add_extra_content_into_iframe(iframe) {
    console.log(iframe);
    console.log(iframe.contents().find("table.innerDetails_table"));
    set_interval_until_true(100, function() {
        console.log("hunting iframe table...")
        const table = iframe.contents().find("table.innerDetails_table");
        if (table.length == 0) {
            return false;
        }
        console.log(table);
        // first, inject style into the frame's head
        const head = iframe.contents().find("head");
        head.append($("<link/>", { rel: "stylesheet", href: "https://s3-eu-west-1.amazonaws.com/perry-web-public-eu/yad2ext/inject_images.css", type: "text/css" }));
        // load images
        const id_tokens = iframe.attr("id").split("_");
        const cat_id = id_tokens[2];
        const sub_cat_id = id_tokens[3];
        const ad_id = id_tokens[4];
        load_extra_content_for_ad(cat_id, sub_cat_id, ad_id, table);
        return true;
    })
}

function set_interval_until_true(interval, callback) {
    var interval_id;
    interval_id = setInterval(function() {
        try {
            clear = !!callback();
        }
        catch (err) {
            clear = true;
            console.log("error from interval-until-true callback, so clearing: %s", err)
        }
        if (clear) {
            clearInterval(interval_id);
        }
    }, interval);
}

function load_extra_content_for_ad(cat_id, sub_cat_id, ad_id, target_table) {
    $.ajax({
        type: "GET",
        url: "http://www.yad2.co.il/Nadlan/ViewImage.php?CatID=" + cat_id + "&SubCatID=" + sub_cat_id + "&RecordID=" + ad_id,
        dataType: 'html',
        async: true,
        success: function(data) {
            window.imgdata = data;
            window.parent.imgdata = data;
            window.parent.parent.imgdata = data;
            load_images(data, target_table, ad_id);
            load_map(data, target_table);
        },
        error: function() {
            console.log("---failed fetching images page");
        }
    });
}

function match_images(page_data) {
    var matches = page_data.match(/http:\/\/images.yad2.co.il.*\/o\/.*.jpg/g);
    function onlyUnique(value, index, self) { 
        return self.indexOf(value) === index;
    }
    var unique_matches = matches.filter(onlyUnique);
    return unique_matches.sort();
}

function load_images(page_data, target_table, ad_id) {
    if (ad_id == undefined) {
        ad_id = "image";
    }
    const images = match_images(page_data);
    var tr = $("<tr/>");
    var ul = $("<ul class='polaroids large-block-grid-4 small-block-grid-2'/>").appendTo(tr);
    for (var i in images) {
        ul.append(
            $("<li/>").append(
                $("<a href='" + images[i] + "' title='" + ad_id + " - " + i + "' target='_blank'/>").append(
                    $("<img src='" + images[i] +"' alt='" + ad_id + " - " + i + "'></img>")
                )
            )
        )
    }
    tr.appendTo(target_table.find("> tbody"));
}

function load_map(page_data, target_table) {
    const mapOptions = match_mapOptions(page_data);
    if (mapOptions == null) {
        return;
    }
    const map_canvas_unique_id = "map-canvas-" + Math.floor((Math.random() * 899999) + 100000);
    var tr = $("<tr/>");
    var div_ad_map = $('<div id="yad2ext-ad_map" style="height: 400px; margin-top: 4px; display: block;"></div>');
    var div_map_canvas = $('<div style="width: 100%; height: 383px; position: relative; overflow: hidden;"></div>').attr("id", map_canvas_unique_id);
    tr.append(div_ad_map.append(div_map_canvas));
    tr.appendTo(target_table.find("> tbody"));

    // // test:
    // execute_on_document(document, function() {
    //     console.log("before we load ourselves: here is window.google", window.google);
    // });

    // const iframe_document = target_table[0].ownerDocument;
    // execute_on_document(iframe_document, function() {
    //     console.log("before we load ourselves (iframe document): here is window.google", window.google);
    // });

    const maps_api_key = "AIzaSyAj8yjjNky7vqe9XYtCxP01d6InDTV3vAg";
    const maps_api_url = "http://maps.googleapis.com/maps/api/js?key=" + maps_api_key + "&libraries=drawing,geometry&sensor=false&&region=IL&language=he";
    
    // // warning: are we loading this maps script infinite times? --> CHECK NETWORK TAB
    // $.getScript(maps_api_url).done(function(script, textStatus) {
    //     console.log("loaded google maps framework with a status of " + textStatus);

        function run_in_context_of_document_window(passed_param_dict) {
            console.log("in context, window.google is", window.google);
            const map_canvas_unique_id = passed_param_dict.map_canvas_unique_id;
            const mapOptions = passed_param_dict.mapOptions;
            console.log("the map_canvas_unique_id is", map_canvas_unique_id);
            $("iframe.ad_iframe").each(function() {
                console.log("this iframe:", $(this));
                $f = $(this).contents().find("table.innerDetails_table");
                if ($f.length > 0) {
                    console.log("this iframe's f:", $f);
                    $p = $f.find('#' + map_canvas_unique_id);
                    if ($p.length > 0) {
                        console.log("this iframe's f p:", $p);
                        $p.html("LA LA LA LA LA " + map_canvas_unique_id);
                        window.g = new window.google.maps.Map($p[0], {
                            center: {lat: mapOptions.lat, lng: mapOptions.lng},
                            zoom: mapOptions.zoom
                        });
                    }
                }
            })
        }

        execute_on_document(document, run_in_context_of_document_window, {
            map_canvas_unique_id: map_canvas_unique_id,
            mapOptions: mapOptions
        });
    // });
}

function match_mapOptions(page_data) {
    try {
        var lat = page_data.match(/(?<=lat:\W*)(-?\d+\.\d+)/g)[0];
        var lng = page_data.match(/(?<=lng:\W*)(-?\d+\.\d+)/g)[0];
        var zoom = page_data.match(/(?<=zoom:\W*)(\d+)/g)[0];
        return {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            zoom: parseInt(zoom)
        }
    }
    catch(err) {
        console.log("cannot find mapOptions details in ad, assuming no address defined: %s", err);
        return null;
    }
}

// source: https://github.com/bluzi/chrome-extension-execute-on-website
// #dontjudge #handsdirty #wakeupscreaming
function execute_on_document(document, func, passed_param_dict) {
    var t=document.querySelector("body")||document.querySelector("html")||document.documentElement;
    if(!t)throw new Error("Failed to execute script because there seems to be no body, html or document at all");
    var o=document.createElement("script");
    passed_param_dict = passed_param_dict || {};
    o.innerText="("+func.toString()+")(JSON.parse('" + JSON.stringify(passed_param_dict) + "'));";
    t.appendChild(o);
};

function adjust_height_for_all_ad_frames() {
    const ad_iframes = $("iframe[id^='ad_iframe_']");
    ad_iframes.each(function() {
        const iframe = $(this);
        try {
            const innerDoc = iframe.contents();
            const frameHeight = innerDoc.find('body').height();
            if (frameHeight > 0) {
                // INSTEAD WE KNOW SO LETS HARD CODE
                // var noNeedFactor = false;
                // try {
                //     noNeedFactor = id.split("_")[2] == 2 || (id.split("_")[2] == 1 && [6, 9, 13].indexOf(parseInt(id.split("_")[3])) != -1);
                // } catch (e) {}
                // var userAgent = navigator.userAgent.toLowerCase();
                // var factor = noNeedFactor || userAgent.indexOf("trident") != -1 || userAgent.indexOf("firefox") != -1 || (userAgent.indexOf("safari") != -1 && userAgent.indexOf("chrome") == -1) || navigator.userAgent.indexOf("msie") != -1 ? 3 : 4;
                const factor = 3;
                iframe.removeAttr("height").height(innerDoc.find('body').height() + factor);
            }
        }
        catch(err) {
            console.log("error adjusting height for %s: %s", iframe, err);
        }
    });
}

// just update them whenever needed
setInterval(adjust_height_for_all_ad_frames, 500);

console.log("inject_images.js loaded")
