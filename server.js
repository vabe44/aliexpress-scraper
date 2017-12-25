var express = require('express');
var fs = require('fs');
var request = require('request');
var bodyParser = require('body-parser')
var path       = require('path')
var cheerio = require('cheerio');
var app = express();
var sleep = require('sleep');
// var nodeExcel = require('excel-export');


//For EJS
app.set('views', './app/views')
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '/app/public')));

var productLinks = [
    "https://www.aliexpress.com/store/product/ROCK-Micro-USB-Cable-Fast-Charging-Mobile-Phone-USB-Charger-Cable-1M-Data-Sync-Cable-for/2496012_32738682603.html",
    "https://www.aliexpress.com/store/product/ROCK-Original-8-Pin-Quick-Charger-Cable-Data-for-iPhone-7-6-6s-plus-5-5s/2496012_32738472806.html",
];

app.get('/format', function (req, res) {
    res.render("format");
});

// app.get('/Excel', function (req, res) {
//     var conf = {};
//     conf.stylesXmlFile = "styles.xml";
//     conf.cols = [{
//         caption: 'string',
//         type: 'string',
//         beforeCellWrite: function (row, cellData) {
//             return cellData.toUpperCase();
//         },
//         width: 28.7109375
//     }, {
//         caption: 'date',
//         type: 'date',
//         beforeCellWrite: function () {
//             var originDate = new Date(Date.UTC(1899, 11, 30));
//             return function (row, cellData, eOpt) {
//                 if (eOpt.rowNum % 2) {
//                     eOpt.styleIndex = 1;
//                 }
//                 else {
//                     eOpt.styleIndex = 2;
//                 }
//                 if (cellData === null) {
//                     eOpt.cellType = 'string';
//                     return 'N/A';
//                 } else
//                     return (cellData - originDate) / (24 * 60 * 60 * 1000);
//             }
//         }()
//     }, {
//         caption: 'bool',
//         type: 'bool'
//     }, {
//         caption: 'number',
//         type: 'number'
//     }];
//     conf.rows = [
//         ['pi', new Date(Date.UTC(2013, 4, 1)), true, 3.14],
//         ["e", new Date(2012, 4, 1), false, 2.7182],
//         ["M&M<>'", new Date(Date.UTC(2013, 6, 9)), false, 1.61803],
//         ["null date", null, true, 1.414]
//     ];
//     var result = nodeExcel.execute(conf);
//     res.setHeader('Content-Type', 'application/vnd.openxmlformats');
//     res.setHeader("Content-Disposition", "attachment; filename=" + "Report.xlsx");
//     res.end(result, 'binary');
// });

app.get('/format', function (req, res) {
    res.render("format");
});

app.get('/rock', function (req, res) {

    const fileName = "./products/ROCK/rock_links" + ".json";
    var rock = JSON.parse(fs.readFileSync(fileName, 'utf8'));
    console.log(rock);

    rock.groups[1].subGroupList[5].products = productLinks;


    fs.writeFile(fileName, JSON.stringify(rock, null, 4), function (err) {
        console.log('Products saved JSON file');
    })

    res.json(rock);

});

app.get('/scrape/:group/:subgroup/:product', function (req, res) {

    const fileName = "./products/ROCK/rock_links" + ".json";
    var rock = JSON.parse(fs.readFileSync(fileName, 'utf8'));

    // for (let index = req.params.product; index < rock.groups[req.params.group].subGroupList[req.params.subgroup].products.length; index++) {
        const url = rock.groups[req.params.group].subGroupList[req.params.subgroup].products[req.params.product];

        request(url, function (error, response, html) {
            if (!error) {
                var $ = cheerio.load(html);

                var name, image, imageName, description, sku, link;
                var product = {
                    name: "",
                    image: "",
                    imageName: "",
                    description: "",
                    sku: "",
                    link: url
                };

                $('h1[class="product-name"]').filter(function () {
                    name = $(this).text();
                    product.name = name;
                })

                if(product.name) {
                    console.log(product.name);
                } else {
                    console.log("product not found??????");
                }

                $('#magnifier > div.ui-image-viewer-thumb-wrap > a > img').filter(function () {
                    image = $(this).attr("src");
                    product.image = image;
                })

                // extract description link from HTML string
                var descriptionLink = getDescriptionLink(html);

                // get product ID from description link
                var sku = getProductId(descriptionLink);
                product.sku = sku;
                product.imageName = sku + ".jpg";

                sleep.sleep(15);
                request(descriptionLink, function (error, response, html) {
                    if (!error) {
                        var d = cheerio.load(html);

                        d('body').filter(function () {
                            description = d(this).text();
                            product.description = description;
                        })

                        scrapedProducts = rock.groups[req.params.group].subGroupList[req.params.subgroup].scrapedProducts || [];
                        scrapedProducts.push(product);
                        rock.groups[req.params.group].subGroupList[req.params.subgroup].scrapedProducts = scrapedProducts;

                        fs.writeFile(fileName, JSON.stringify(rock, null, 4), function (err) {
                            console.log('Product saved to output.json file');
                            // Finally, we'll just send out a message to the browser reminding you that this app does not have a UI.
                            // res.json(saved);
                            sleep.sleep(15);
                            var nextProductId = Number(req.params.product) + 1;
                            res.redirect(`/scrape/${req.params.group}/${req.params.subgroup}/${nextProductId}`);
                        })
                        // res.redirect('/fos');
                    }
                });
                // res.redirect('/foskakakka');
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