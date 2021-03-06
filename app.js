/**
 * Module dependencies.
 */

var express = require('express'),
    app = module.exports = express.createServer(),
    mongo = require('mongolian'),
    mongo_server = new mongo(),
    db = mongo_server.db('cheapchap'),
    qs = require('querystring'),
    etsy = require('./models/etsy').etsy(db.collection('etsy')),
    hp = require('./models/hyperpublic').hyperpublic(db.collection('locations'));
    var yelp = require("yelp").createClient({
            consumer_key: "swwatQcoJz1db2Ec2hFXZQ", 
            consumer_secret: "-XTXcYvgPh8anInpAYrSImmOTHs",
            token: "jLzcmltuso2zCO51O6ID1S8UcePSiX_S",
            token_secret: "LlDzta29cjw-fh-4fH0eMNe2jbI"
     });
     var geoip = require('geoip')
     var city = new geoip.City('/usr/share/GeoIP/GeoLiteCity.dat');  

/**
 * Server configuration.
 */
app.configure(function(){
   app.set('views', __dirname + '/views');
   app.set('view engine', 'jade');
   app.use(express.bodyParser());
   app.use(express.methodOverride());
   app.use(express.cookieParser());
   app.use(express.session({ secret: 'ga5uP7AKuprethew' }));
   app.use(require('stylus').middleware({ src: __dirname + '/public' }));
   app.use(app.router);
   app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
   app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
   app.use(express.errorHandler()); 
});

/**
 * Routes
 */
app.get('/', function(req, res){
   res.render('index', { title: "cheapchap" });
});

app.get('/city', function(req,res){
   console.log(req.connection);
   city.lookup(req.connection.remoteAddress, function(err, data) {
    if (err) {throw err;}
    if (data) {
        console.log(data);
         res.json(data);
    }
  });

});


app.get("/hp/:loc/:cat/:price", function (req, res) {
   console.log(req.params);
   hp.findLocations (
      req.params.loc, 
      req.params.price, 
      req.params.cat,
      function (arr) {
         res.json(arr);
      }
   );
});


app.get("/yelp/:location/:catagory/:num_to_return", function (req, res){
      for( var i =0; i < 10; i++){
              yelp.search({term: req.params.catagory, location: req.params.location, offset: i*20}, function(error, data) {
                 //console.log(data);
                 //console.log("yelp gave us " +   data['businesses'].length + " results");
                 for(var key in data['businesses']){
                    var item = data['businesses'][key];
                    var toInsert = {};
                    toInsert['catagory'] = req.params.catagory;
                    toInsert['location'] = req.params.location;
                    toInsert['_id'] = item['name'] + req.params.location;
                    toInsert['phone'] = item['phone'];
                    toInsert['price'] = 1;
                    toInsert['image'] = item['image_url'];
                    toInsert['name'] = item['name'];
                    toInsert['address'] = item['location']['display_address'][0] + ", " +  item['location']['display_address'][1];
                    var  locations = db.collection('locations');
                    locations.save(toInsert);
                 }
         });
      }
         res.send("Ok");
});

app.post("/date_engine",  function (request, response) {
  var zip_code = request.body.location; 
  if ( typeof(zip_code) == "undefined"){
      response.send("<message><content>You need to set a location before you can get date ideas <br/><a query=\"scratch.russfrank.us\" /> Back to home <br/> <a query='scratch.russfrank.us' /> Set Location</content></message>\n");
        return; 
  }
  zip_code = zip_code.replace(" ","+");
  //console.log("zip code is..." + zip_code);
  var price = 5;
  hp.findLocations( zip_code, price, "food", function (food_arr){
    // console.log(food_arr);
     var food_place = food_arr[0];
      hp.findLocations( zip_code, "any", "hotels", function (hotel_arr){
         var hotel_place = hotel_arr[0]; 

         hp.findLocations( zip_code, price, "entertainment", function (frolic_arr){
            var frolic_place = frolic_arr[0]; 
            etsy.findGifts( "25", "1", function (error, data){
               //console.log(hotel_place);
               //console.log(food_place);
               var gift = data[0];
               gift['name'] = gift['name'].replace("/<.*?>/","");
               gift['name'] = gift['name'].replace("/&/","");
               gift['description'] = gift['description'].replace("/&/","");
               var output = "<message><content>\n";
                  output += "Your Date Intinerary:<br/>\n";


                  output += "<anchor><message><content>" + gift['name'] + "-- $" + gift['price'] + "<br/>" + gift['description']+ " </content></message></anchor>Gift: " + gift['name'] + " -- $" + gift['price'] + "<br/>\n";

                  if(frolic_place){
                  output += "<anchor><message><content>" + frolic_place['name'] + "<br/>" + frolic_place['address']+ " </content></message></anchor>Activity: " + frolic_place['name'] +  "<br/>\n";
                  }
                  
                  if(food_place){
                  output += "<anchor><message><content>" + food_place['name'] + "<br/>" + food_place['address'] + " </content></message></anchor>Food: " + food_place['name'] +"<br/>\n";
                  
                  }
            
                  if(hotel_place){
                  output += "<anchor><message><content>" + hotel_place['name'] +  "<br/>" + hotel_place['address']+ " </content></message></anchor>Accommodations: " + hotel_place['name']+ "<br/>\n";
                  }
               output += "</content></message>\n";    
               response.send(output);
            });
         });

    });


   });
      
});

app.get("/etsy/:max_price/:num_to_return", function (req,res){
   etsy.find(
      req.params.max_price, req.params.num_to_return,
      function (data) {
         res.json(data);
      }
   );
});

app.listen(3200);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
