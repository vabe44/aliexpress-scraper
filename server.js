var express = require('express');
var fs = require('fs');
var request = require('request');
var bodyParser = require('body-parser')
var path       = require('path')
var cheerio = require('cheerio');
var app = express();
var sleep = require('sleep');

//For EJS
app.set('views', './app/views')
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '/app/public')));

var productLinks = [
    "https://www.aliexpress.com/store/product/USAMS-Fast-Phone-Car-Charger-Quick-Car-Charger-Qualcomm-3-0-for-Samsung-Xiaomi-HTC-Compatible/2008001_32815415695.html",
    "https://www.aliexpress.com/store/product/USAMS-Car-Charger-Max-2-1A-USB-for-Mobile-Phone-Adapter-Car-USB-Phone-Charger-for/2008001_32676034134.html",
    "https://www.aliexpress.com/store/product/USAMS-Dual-USB-Car-Charger-Digital-LED-Display-DC-5V-3-4A-Universal-car-phone-charger/2008001_32787505770.html",
    "https://www.aliexpress.com/store/product/USAMS-Universal-Dual-Ports-Car-Charger-2-1A-USB-Smart-LED-Display-Car-USB-Phone-Charger/2008001_32846042447.html",
    "https://www.aliexpress.com/store/product/Smart-Phone-Car-Charger-USAMS-Square-Max-2-4A-Dual-USB-Port-Adapter-Car-Charger-for/2008001_32798362465.html",
    "https://www.aliexpress.com/store/product/USAMS-Car-Charger-5V-3-1A-Fast-Charge-Dual-USB-Metal-Cigar-Lighter-Car-Phone-Charger/2008001_32764254902.html",
    "https://www.aliexpress.com/store/product/USAMS-2-Ports-QC-3-0-Car-Charger-Qualcomm-3-0-Phone-Quick-Car-Charger-Compatible/2008001_32845288907.html",
    "https://www.aliexpress.com/store/product/5V-2-4A-USB-Charger-USAMS-Phone-Charger-Build-in-Bluetooth-4-1-Earphone/2008001_32747978408.html",
    
];

app.get('/format', function (req, res) {
    res.render("format");
});

app.get('/Excel', function (req, res) {

    var rows = [];
    const fileName = "./products/USAMS/usams_links" + ".json";
    var rock = JSON.parse(fs.readFileSync(fileName, 'utf8'));

    var writeStream = fs.createWriteStream("usams_file.xls");
    var header =    "Name" +"\t"+
                    "Image" +"\t"+
                    "ImageName" +"\t"+
                    "Description" +"\t"+
                    "SKU" +"\t"+
                    "Link"  +"\t"+
                    "Category 1" +"\t"+
                    "Category2" +"\n";
    writeStream.write(header);

    for (let i = 0; i < rock.groups.length; i++) {
        const group = rock.groups[i];

        for (let i2 = 0; i2 < rock.groups[i].subGroupList.length; i2++) {
            const subgroup = rock.groups[i].subGroupList[i2];

            for (let i3 = 0; i3 < rock.groups[i].subGroupList[i2].scrapedProducts.length; i3++) {
                const product = rock.groups[i].subGroupList[i2].scrapedProducts[i3];

                product.description = product.description.replace(/(\r\n|\n|\r|\t)/gm,"").trim();
                if(!product.description.length) {
                    product.description = "";
                }

                var row =   product.name +"\t"+
                            product.image +"\t"+
                            product.imageName +"\t"+
                            product.description +"\t"+
                            product.sku +"\t"+
                            product.link +"\t"+
                            rock.groups[i].name +"\t"+
                            rock.groups[i].subGroupList[i2].name +"\n";
                // writeStream.write(row);
                rows.push(row);
            }
        }
    }
    for (let index = 0; index < rows.length; index++) {
        const element = rows[index];
        writeStream.write(element);
    }
    writeStream.close();
});

app.get('/format', function (req, res) {
    res.render("format");
});

app.get('/usams', function (req, res) {

    const fileName = "./products/USAMS/usams_links" + ".json";
    var usams = JSON.parse(fs.readFileSync(fileName, 'utf8'));
    console.log(usams);

    usams.groups[3].subGroupList[1].products = productLinks;

    fs.writeFile(fileName, JSON.stringify(usams, null, 4), function (err) {
        console.log('Products saved JSON file');
    })

    res.json(usams);

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

    const fileName = "./products/USAMS/usams_links" + ".json";
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