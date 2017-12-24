var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();
var sleep = require('sleep');

var a = "https:";

var fileName = "iPhone_8_8_Plus.json";
var productLinks = [
    "https://www.aliexpress.com/store/product/USAMS-For-iPhone-8-Glass-0-25mm-9H-3D-Carbon-Fiber-Full-Cover-Tempered-Glass-for/2008001_32845561907.html",
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