var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();
var sleep = require('sleep');

var productLinks = [
    "https://www.aliexpress.com/store/product/USAMS-Breathing-LED-Phone-Cable-For-iPhone-X-8-7-6-Plus-2A-Nylon-Braided-for/2008001_32845060639.html",
    "https://www.aliexpress.com/store/product/For-iphone-5-5s-Usb-Cable-USAMS-1M-3Ft-Zinc-Alloy-2-1A-Noodle-Usb-Charger/2008001_32606639968.html",
    "https://www.aliexpress.com/store/product/USAMS-Type-C-USB-Type-C-to-8Pin-16W-Quick-Charger-USB-C-Cable-Sync-Date/2008001_32842643044.html",
    "https://www.aliexpress.com/store/product/Auto-disconnect-USB-Cable-for-iPhone-7-6-5-USAMS-Phone-lighting-Cable-for-iOS-11/2008001_32827146792.html",
    "https://www.aliexpress.com/store/product/USAMS-Retractable-Fast-Charging-Cable-For-iPhone-Charging-Data-USB-Cable-For-iPhone-8-7-6/2008001_32828294958.html",
    "https://www.aliexpress.com/store/product/2-in-1-USAMS-1-2M-Charging-Mobile-Phone-Cables-Charger-iOS-Data-USB-Cable-for/2008001_32834125309.html",
    "https://www.aliexpress.com/store/product/USAMS-Bending-Cable-For-iPhone-X-8-7-6-Phone-Cable-2A-90-Degree-L-bending/2008001_32846423899.html",
    "https://www.aliexpress.com/store/product/USAMS-Retro-Style-Leather-Usb-Cable-30cm-Short-2A-Fast-Charger-Date-Cable-for-iPhone-6/2008001_32789295717.html",
    "https://www.aliexpress.com/store/product/Micro-USB-Magnetic-Cable-USAMS-2A-1m-Nylon-Magnetic-Data-Sync-Charger-Cable-for-iPhone-Magnet/2008001_32833195853.html",
    "https://www.aliexpress.com/store/product/USAMS-3-IN-1-USB-Cable-Type-C-Micro-USB-For-iphone-5-6-7-8/2008001_32835350773.html",
    "https://www.aliexpress.com/store/product/USB-Cable-For-iPhone-Charger-USAMS-Usb-Cable-1M-Zinc-Alloy-2-1A-Usb-Charger-Data/2008001_32798878110.html",
    "https://www.aliexpress.com/store/product/USAMS-bend-for-iPhone-Cable-iOS10-2A-Fast-Charging-Flat-Usb-Charger-Cable-for-iPhone-7/2008001_32808152203.html",
    "https://www.aliexpress.com/store/product/Micro-USB-Magnetic-Cable-USAMS-2-1A-1m-Nylon-Magnetic-Data-Sync-Charger-Cable-for-Android/2008001_32806469650.html",
    "https://www.aliexpress.com/store/product/USAMS-IOS-9-MFi-Cable-For-lightning-cable-2-1A-Fast-Charging-usb-data-sync-charger/2008001_32824061365.html",
    "https://www.aliexpress.com/store/product/Micro-USB-Magnetic-Cable-USAMS-2-1A-1-2m-Nylon-Magnetic-Data-Sync-Charger-Cable-for/2008001_32833253586.html",
    "https://www.aliexpress.com/store/product/USAMS-Micro-usb-cable-Fast-Charger-Usb-Charging-Cable-for-iPhone-8-8-plus-cable-usb/2008001_32832948318.html"
];

app.get('/scrape', function (req, res) {

    // for (const productLink of productLinks) {

        var url = productLinks[0];

        request(url, function (error, response, html) {
            if (!error) {
                var $ = cheerio.load(html);

                var name, image, description, sku;
                var product = {
                    name: "",
                    image: "",
                    description: "",
                    sku: "",
                    link: url
                };

                $('h1[class="product-name"]').filter(function () {
                    name = $(this).text();
                    product.name = name;
                })

                $('#magnifier > div.ui-image-viewer-thumb-wrap > a > img').filter(function () {
                    image = $(this).attr("src");
                    product.image = image;
                })

                // extract description link from HTML string
                var descriptionLink = getDescriptionLink(html);

                // get product ID from description link
                var sku = getProductId(descriptionLink);
                product.sku = sku;

                // sleep.sleep(2);
                request(descriptionLink, function (error, response, html) {
                    if (!error) {
                        var d = cheerio.load(html);

                        d('body').filter(function () {
                            description = d(this).text();
                            product.description = description;
                        })

                        fs.appendFile('output.json', ',' + JSON.stringify(product, null, 4), function (err) {
                            console.log('Product saved to output.json file');
                            var saved = productLinks.splice(0, 1);
                            // Finally, we'll just send out a message to the browser reminding you that this app does not have a UI.
                            res.json(saved);
                            // sleep.sleep(3);
                            // res.redirect("/scrape");
                        })
                    }
                });
            }
        });
    // }

    // res.send("Done!");
})

app.listen('8081')
console.log('Magic happens on port 8081');
exports = module.exports = app;

function getDescriptionLink(html) {
    var start = html.indexOf("https://aeproductsourcesite.alicdn.com/product/description");
    var substring = html.substring(start);
    var end = substring.indexOf('"');
    return substring.substring(0, end);
}

function getProductId(descriptionLink) {
    var start2 = descriptionLink.indexOf("productId=");
    var substring2 = descriptionLink.substring(start2);
    var end2 = substring2.indexOf("&key");
    return substring2.substring(0, end2).replace("productId=", "");
}