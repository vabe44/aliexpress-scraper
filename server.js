var express = require('express');
var fs = require('fs');
var request = require('request');
var bodyParser = require('body-parser')
var path       = require('path')
var cheerio = require('cheerio');
var app = express();
var sleep = require('sleep');
const download = require('image-downloader');

//For EJS
app.set('views', './app/views')
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '/app/public')));

var productLinks = [

    "https://www.aliexpress.com/store/product/USAMS-For-iPhone-OTG-Micro-Usb-Adapter-Micro-Cable-to-Light-Charging-Data-Sync-Cable-for/2008001_32831123612.html",
    "https://www.aliexpress.com/store/product/Micro-USB-To-USB-OTG-USAMS-Adapter-2-0-Converter-For-Samsung-Galaxy-S5-Tablet-Pc/2008001_32829008905.html",
    "https://www.aliexpress.com/store/product/USAMS-Metal-USB-C-Type-C-Male-to-USB-3-0-Female-for-xiaomi-4c-Type/2008001_32829076561.html",
    "https://www.aliexpress.com/store/product/USAMS-For-iphone-5-6-7-Plus-TF-Card-128GB-Max-Expansion-Type-Adapter-Charging-For/2008001_32844051524.html",
    "https://www.aliexpress.com/store/product/USAMS-2-in-1-For-Lightning-to-3-5mm-AUX-Plug-Adapter-for-iPhone-7-iPhone/2008001_32831795581.html",
    "https://www.aliexpress.com/store/product/Micro-Usb-Cable-to-Usb-Type-C-Type-C-Adapter-USAMS-Data-Sync-Charging-For-Oneplus/2008001_32605763054.html",
    "https://www.aliexpress.com/store/product/USAMS-HDMI-Cable-HDMI-to-8-pin-cable-2m-HDMI-4k-3D-60FPS-Cable-for-iPhone/2008001_32815707226.html",
    "https://www.aliexpress.com/store/product/USAMS-Dual-Ports-For-iPhone-Adapter-Aluminum-Alloy-Charging-for-Lightning-OTG-for-iPhone-8-7/2008001_32841781882.html",
    
];

app.get('/usams', function (req, res) {

    const fileName = "./products/USAMS/usams_links" + ".json";
    var usams = JSON.parse(fs.readFileSync(fileName, 'utf8'));
    console.log(usams);

    usams.groups[8].subGroupList[0].products = productLinks;

    fs.writeFile(fileName, JSON.stringify(usams, null, 4), function (err) {
        console.log('Products saved JSON file');
    })

    res.json(usams);

});

app.get('/images', function (req, res) {

    async function downloadIMG(options) {
        try {
          const { filename2, image } = await download.image(options)
          console.log(filename2) // => /path/to/dest/image.jpg
        } catch (e) {
          throw e
        }
    }

    var rows = [];
    const fileName = "./products/USAMS/usams_links" + ".json";
    var rock = JSON.parse(fs.readFileSync(fileName, 'utf8'));

    for (let i = 0; i < rock.groups.length; i++) {
        const group = rock.groups[i];

        for (let i2 = 0; i2 < rock.groups[i].subGroupList.length; i2++) {
            const subgroup = rock.groups[i].subGroupList[i2];

            for (let i3 = 0; i3 < rock.groups[i].subGroupList[i2].scrapedProducts.length; i3++) {
                const product = rock.groups[i].subGroupList[i2].scrapedProducts[i3];

                const options = {
                    url: product.image,
                    dest: './products/USAMS/images/' + product.imageName
                }
                // sleep.sleep(2);
                downloadIMG(options)
                // rows.push(row);
            }
        }
    }
});

app.get('/usamsimages', function (req, res) {

    async function downloadIMG(options) {
        try {
          const { filename2, image } = await download.image(options)
          console.log(filename2) // => /path/to/dest/image.jpg
        } catch (e) {
          throw e
        }
    }

    var rows = [];
    const fileName = "./products/USAMS/all" + ".json";
    var rock = JSON.parse(fs.readFileSync(fileName, 'utf8'));

    for (let i = 0; i < rock.length; i++) {
        const product = rock[i];

        const options = {
            url: product.image,
            dest: './products/USAMS/images/' + product.sku + ".jpg"
        }
        // sleep.sleep(2);
        downloadIMG(options)
        // rows.push(row);
    }
});

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

app.get('/scrapeimages', function (req, res) {

    const fileName = "./products/USAMS/all" + ".json";
    var json = JSON.parse(fs.readFileSync(fileName, 'utf8'));

    for (let i = 0; i < json.length; i++) {
        const url = json[i].link;

        request(url, function (error, response, html) {
            if (!error) {
                var $ = cheerio.load(html);

                var name, images, image, imageName, attributeImages, description, sku, link;
                var product = {
                    name: "",
                    // image: "",
                    // imageName: "",
                    images: [],
                    attributeImages: [],
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

                // extract description link from HTML string
                var descriptionLink = getDescriptionLink(html);

                // get product ID from description link
                var sku = getProductId(descriptionLink);
                product.sku = sku;
                // product.imageName = sku + ".jpg";

                // get product images
                $('#j-image-thumb-list > li > span > img').filter(function () {
                    let image = {};
                    image.link = $(this).attr("src").replace("_50x50.jpg", "");
                    image.name = $(this).attr("alt");
                    product.images.push(image);
                })

                // get attribute images
                $('.item-sku-image > a > img').filter(function () {
                    let image = {};
                    image.link = $(this).attr("src").replace("_50x50.jpg", "");
                    image.name = $(this).attr("title");
                    product.attributeImages.push(image);
                })

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

                        fs.writeFile(fileName + ".new.json", JSON.stringify(rock, null, 4), function (err) {
                            console.log('Product saved to output.json file');
                            // Finally, we'll just send out a message to the browser reminding you that this app does not have a UI.
                            // res.json(saved);
                            sleep.sleep(15);
                            // var nextProductId = Number(req.params.product) + 1;
                            // res.redirect(`/scrape/${req.params.group}/${req.params.subgroup}/${nextProductId}`);
                        })
                        // res.redirect('/fos');
                    }
                });
                // res.redirect('/foskakakka');
            }
        });
    }
    // res.send("Done!");
});

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