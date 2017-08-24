// key = AIzaSyAtt6iRuzA4opWq4fS7at0TRPrNJtM7LQA
var map, infowindow;

var hotelInfo = [
        {
            name : "Del Posto",
            location : {lat: 40.74353929999999, lng: -74.00794830000001},
            fs_id : "4533d338f964a5208f3b1fe3"
        },
        {
            name : "Russ & Daughters Cafe",
            location : {lat: 40.7196729, lng: -73.9896809},
            fs_id : "5244bd0e11d2d511de3e244e"
        },
        {
            name : "Blue Hill",
            location : {lat: 40.7320465, lng: -73.99966849999998},
            fs_id : "3fd66200f964a52078e31ee3"
        },
        {
            name : "Gramercy Tavern",
            location : {lat: 40.7384555, lng: -73.9885064},
            fs_id : "3fd66200f964a520aee91ee3"
        },
        {
            name : "Spice Symphony",
            location : {lat: 40.75586879999999, lng: -73.9715473},
            fs_id : "4bb245d92397b71337ca36b3"
        },
        {
            name : "Gabriel Kreuther",
            location : {lat: 40.754538, lng: -73.98250280000002},
            fs_id : "5552087d498eb30c149f785a"
        },
        {
            name : "Eleven Madison Park",
            location : {lat: 40.741726, lng: -73.98717299999998},
            fs_id : "457ebeaaf964a5203f3f1fe3"
        },
        {
            name : "Le Bernardin",
            location : {lat: 40.7615691, lng: -73.98180479999996},
            fs_id : "3fd66200f964a52066e31ee3"
        }
];


// Foursquare API Url parameters in global scope
var BaseUrl = "https://api.foursquare.com/v2/venues/",
    fsClient_id = "client_id=QJEM3MM2SEXPOEKLVB0Z3PZ0WOCMZAJHPZUBHBLWMEXBZBEV",
    fsClient_secret = "&client_secret=R30CR0S3CTZ5DVOPFP1Z0UNGOAUYOXNOWWPFLEF3B2MRZDTX",
    fsVersion = "&v=20170108";

//On error event when map fails
function mapError() {
    document.getElementById('map-error').innerHTML = 'Failed to load Google Maps. Check you internet connection and reload';
}

//OnCallBack Initialize map
function initMap() {
    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 40.7447587, lng: -73.9932811},
        zoom: 13
    });

//Google map elements - set custom map marker
  var newMarker = {
    "url": "img/marker.png",
    // This marker is 32 pixels wide by 32 pixels high.
    "size": new google.maps.Size(32, 32),
    // The origin for this image is (0, 0).
    "origin": new google.maps.Point(0, 0),
    // The anchor for this image is the base of the flagpole at (0, 32).
    "anchor": new google.maps.Point(0, 32)
};

    google.maps.event.addDomListener(window, "resize", function() {
        var center = map.getCenter();
        google.maps.event.trigger(map, "resize");
        map.setCenter(center);

        if (window.matchMedia('(max-width:767px)').matches)
        {
            // do functionality on screens smaller than 768px
            document.getElementById("wrapper").classList.remove('toggled');
        }
    });

    infowindow = new google.maps.InfoWindow({
        maxWidth: 200,
        content: ""
      });

    // Close infowindow when clicked elsewhere on the map
    map.addListener("click", function(){
        infowindow.close(infowindow);
    });

    // Get contect infowindows
    function getContent(hotelItem) {
    var tips = "<h3>" + hotelItem.name +"</h3><br><div style='width:200px;min-height:120px'>"+hotelItem.text.join("")+"<br><a href='https://www.foursquare.com'>Information provided by Foursuqare.com</a></div>";
    var errorString = "Oops, Foursquare content not available.";
    if (hotelItem.name.length > 0) {
      return tips;
      } else {
      return errorString;
      }
  }

    // Bounce effect on marker
    function toggleBounce(marker) {
    if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
    } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
        marker.setAnimation(null);
        }, 700);
        }
    }


// ViewModel is here
var ViewModel = function (){
    var self = this;

    this.hotelList = ko.observableArray([]);

    hotelInfo.forEach(function(hotelItem){
        self.hotelList.push(new Hotel(hotelItem));
    });

    self.hotelList().forEach(function(hotelItem){
        var marker = new google.maps.Marker({
            map: map,
            icon:newMarker,
            position: hotelItem.location,
            animation: google.maps.Animation.DROP
        });
        hotelItem.marker = marker;
        // Create an onclick event to open an infowindow and bounce the marker at each marker
        marker.addListener("click", function(e) {
        map.panTo(this.position);

        //pan down infowindow by 200px to keep whole infowindow on screen
        map.panBy(0, -200);
        infowindow.setContent(getContent(hotelItem));
        infowindow.open(map, marker);
        toggleBounce(marker);
    });
    });


    // Foursquare API request
    self.getFoursquareData = ko.computed(function(){
        self.hotelList().forEach(function(hotelItem) {

        // Set initail variables to build the correct URL for each hotel
        var  venueId = hotelItem.fs_id + "/tips?sort=recent&limit=5&";
        var foursquareUrl = BaseUrl + venueId + fsClient_id + fsClient_secret + fsVersion;

        // AJAX call to Foursquare
        $.ajax({
            type: "GET",
            url: foursquareUrl,
            dataType: "json",
            cache: false,
            success: function(data) {
            var response = data.response ? data.response : "";
            response.tips.items.forEach(function(item){
                hotelItem.text.push('<p>•'+item.text+'</p>');
            });
          }
        }).fail(function(){
            alert("Oops! Foursquare request failed. Try reloading the Map.");
        });
      });
    });


    // Creating click for the list item
    this.itemClick = function (space) {
        var markerId = space.markerId;
        google.maps.event.trigger(space.marker, "click");
    };

    // Filtering the hotel list
    self.filter = ko.observable("");

    this.filteredSpaceList = ko.dependentObservable(function() {
        var query = this.filter().toLowerCase();
        if (!query) {
        return ko.utils.arrayFilter(self.hotelList(), function(item) {
        item.marker.setVisible(true);
        return true;
        });
        } else {
            return ko.utils.arrayFilter(this.hotelList(), function(item) {
            if (item.name.toLowerCase().indexOf(query) >= 0) {
            item.marker.setVisible(true);
            return true;
          } else {
            item.marker.setVisible(false);
            return false;
          }
        });
      }
    }, this);

};


var Hotel = function (data){
    this.name = data.name;
    this.location = data.location;
    this.fs_id = data.fs_id;
    this.marker="";
    this.text=[];
};

ko.applyBindings(new ViewModel());
}