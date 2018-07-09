console.log("inject_favorites loading");

function get_search_and_append(pageNumber, maxPage) {
    if (pageNumber == undefined) {
        pageNumber = 1;
    }
    if (pageNumber == 1) {
        console.log("first page - clearing data_all");
        window.data_all = "";
    }
    if (pageNumber == 30) {
        console.log("page safety limit reached, aborting without finaization");
        return;
    }

    // const search_params = "multiSearch=1&arrArea=18,42,54,81,4,71,10&arrCity=&arrHomeTypeID=5&fromRooms=5.5&untilRooms=6.5&fromPrice=4500000&untilPrice=5700000&PriceType=1&fromSquareMeter=&untilSquareMeter=&FromFloor=&ToFloor=&Info=&PriceOnly=1&ImgOnly=1&AreaID=&City=&HomeTypeID=&arrAreaID=18,42,54,81,4,71,10";
    // var search_params = "multiSearch=1&arrArea=18%2C42%2C54%2C81%2C4%2C71%2C10&arrCity=&arrHomeTypeID=5%2C39%2C32&fromRooms=5&untilRooms=7&fromPrice=4500000&untilPrice=6000000&PriceType=1&fromSquareMeter=&untilSquareMeter=&FromFloor=&ToFloor=&Info=";
    const pre_search = window.location.href.split("?")[0];
    const search_params = window.location.search;
    // note: even if "Page=..." appears in the search string, appending another one overrides it so we're good
    const url = pre_search + search_params + "&Page=" + pageNumber
    
    $.ajax({
        type: "GET",
        url: url,
        dataType: 'html',
        async: true,
        success: function(data) {
            console.log("---page %s", pageNumber);
            window.data_last_search = data;
            console.log("data received length %d", data.length);
            const extra_ad_data = data.split(/<.th>\W+<.tr>/)[3].split(/<.table>\W+<div/)[0];
            console.log("extra_ad_data length %d", extra_ad_data.length);
            if (extra_ad_data.includes("no_ads_title")) {
                console.log("there is no data in page %s, stopping and finalizing", pageNumber);
                finalize();
            }
            else if (pageNumber == maxPage) {
                console.log("saving and finalizing, max page reached");
                window.data_all = window.data_all + "\n" + extra_ad_data + "\n";
                finalize();
            }
            else {
                console.log("saving and sending next page search");
                window.data_all = window.data_all + "\n" + extra_ad_data + "\n";
                get_search_and_append(pageNumber + 1, maxPage);
            }
        },
        error: function() {
            console.log("---page %s failed", pageNumber);
        }
    });
}


function get_fav_tiv_template(callback) {
    const CatID = 2;
    const SubCatID = 5;
    if (window.data_fav_tiv != undefined) {
        callback();
    }
    else {
        $.ajax({
            type: "POST",
            url: "http://www.yad2.co.il/ajax/favorites/ajax_load_table.php",
            // tiv numbers 2 5 1
            data: "CatID=" + CatID + "&SubCatID=" + SubCatID + "&Page=" + 1,
            dataType: 'html',
            async: true,
            success: function(data) {
                window.data_fav_tiv = data;
                callback();
            }
        });
    }
}


function spliceit(new_content) {
    result = ""
    a = window.data_fav_tiv.split(/<.th>\W+<.tr>/);
    prefix = a[0];
    result = result + prefix + '</th></tr>\n';
    b = a[1].split(/<.table>\W+<div/);
    content = new_content;
    suffix = b[1]
    result = result + content + "</table>\n<div" + suffix;
    window.result = result;
}

function present_result() {
    var tivTrade_prefix = "tiv_";
    var loadObjId = $("#" + tivTrade_prefix + "my_table");
    var mainObjId = $("#" + tivTrade_prefix + "main_table");
    loadObjId.html(window.result);
    mainObjId.hide();
    loadObjId.show();
}

function clean_content(content) {
    x = $($.parseHTML(content));
    x = x.not("tr.banner_strip");
    var xx = "";
    var skipped = false;
    x.filter("tr").each(function() {
        try {
            xx = xx + $(this)[0].outerHTML + "\n";
        }
        catch(err) {
            console.log("skipping --- %s", err.message);
            skipped = true;
        }
    });
    if (skipped) {
        alert("warning: some elements were skipped");
    }
    return xx;
}

function finalize() {
    get_fav_tiv_template(function() {
        spliceit(clean_content(window.data_all));
        present_result();        
    })
}

$("body").append($('<a href="#" class="corner-button cbtn-2">full tiv search</a>').click(function() {
    get_search_and_append();
    return false;
}));

console.log("inject_favorites loaded");