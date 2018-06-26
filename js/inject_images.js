console.log("inject_images.js loading")

monitor_appearance("div.ad_iframe", function() {
    console.log($(this));
    const iframe = $(this).find("iframe.ad_iframe");
    add_images_into_iframe(iframe);
})

function add_images_into_iframe(iframe) {
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
        load_images_for_ad(cat_id, sub_cat_id, ad_id, table);
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

function load_images_for_ad(cat_id, sub_cat_id, ad_id, target_table) {
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
        },
        error: function() {
            console.log("---failed fetching images page");
        }
    });
}

// FROM WITHIN IFRAME - WAS NOT TRIGGERING.
// function add_images_if_ad_iframe() {
//     if (window.location.pathname == "/Nadlan/tivsalesDetails.php") {
//         console.log("ad details iframe detected, loading images")
//         const ad_id = get_current_ad_id_from_within_iframe();
//         if (ad_id != null) {
//             const target_table = $("table.innerDetails_table");
//             const cat_id = 2;
//             const sub_cat_id = 5;
//             load_images_for_ad(cat_id, sub_cat_id, ad_id, target_table);
//         }
//     }
//     else {
//         console.log("not an ad details iframe (not loading images)", window.location);
//     }
// }
//
// function get_current_ad_id_from_within_iframe(current_window) {
//     if (current_window == undefined) {
//         current_window = window;
//     }
//     var x = current_window.location.search.match(/(?<=NadlanID=)(\d+)/g);
//     if (x == null) {
//         return null;
//     }
//     else {
//         return x[0];
//     }
// }

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
