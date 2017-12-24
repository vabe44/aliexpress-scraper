var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();
var sleep = require('sleep');

var a = "https:";

var fileName = "OTG_and_Adapter.json";
var productLinks = [
    "https://www.aliexpress.com/store/product/Micro-USB-To-USB-OTG-USAMS-Adapter-2-0-Converter-For-Samsung-Galaxy-S5-Tablet-Pc/2008001_32829008905.html",
    "https://www.aliexpress.com/store/product/USAMS-Metal-USB-C-Type-C-Male-to-USB-3-0-Female-for-xiaomi-4c-Type/2008001_32829076561.html",
    "https://www.aliexpress.com/store/product/USAMS-2-in-1-For-Lightning-to-3-5mm-AUX-Plug-Adapter-for-iPhone-7-iPhone/2008001_32831795581.html",
    "https://www.aliexpress.com/store/product/USAMS-For-iphone-5-6-7-Plus-TF-Card-128GB-Max-Expansion-Type-Adapter-Charging-For/2008001_32844051524.html",
    "https://www.aliexpress.com/store/product/Micro-Usb-Cable-to-Usb-Type-C-Type-C-Adapter-USAMS-Data-Sync-Charging-For-Oneplus/2008001_32605763054.html",
    "https://www.aliexpress.com/store/product/USAMS-HDMI-Cable-HDMI-to-8-pin-cable-2m-HDMI-4k-3D-60FPS-Cable-for-iPhone/2008001_32815707226.html",
    "https://www.aliexpress.com/store/product/USAMS-Dual-Ports-For-iPhone-Adapter-Aluminum-Alloy-Charging-for-Lightning-OTG-for-iPhone-8-7/2008001_32841781882.html",
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

                sleep.sleep(15);
                request(descriptionLink, function (error, response, html) {
                    if (!error) {
                        var d = cheerio.load(html);

                        d('body').filter(function () {
                            description = d(this).text();
                            product.description = description;
                        })

                        fs.appendFile(fileName, ',' + JSON.stringify(product, null, 4), function (err) {
                            console.log('Product saved to output.json file');
                            var saved = productLinks.splice(0, 1);
                            // Finally, we'll just send out a message to the browser reminding you that this app does not have a UI.
                            // res.json(saved);
                            sleep.sleep(15);
                            res.redirect("/scrape");
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