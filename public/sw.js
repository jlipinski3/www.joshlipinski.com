"use strict";

(function(){
  var cache_v = '12202019_510pm'; //replaced during build. to compare build version vs service worker version
  const cache_list = [ //add entire manifest list here
    "./",
    "./index.html",
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.11.2/css/all.min.css",
    "https://fonts.googleapis.com/css?family=Playfair+Display:400,400i,700,700i&display=swap",
    "./images/josh_lipinski_bio.jpg",
    "./images/stonemountainhomebuilderscom.jpg",
    "./images/greylockrealtycom.jpg",
    "./images/redhorserealestatecom.jpg",
    "./images/isgoodrealtycom.jpg",
    "./images/mountainstreamlandcom.jpg",
    "./images/westernmasslandcom.jpg",
    "./js/jquery-3.3.1.min.js",
    "./__/firebase/7.5.0/firebase-app.js",
    "./__/firebase/7.5.0/firebase-analytics.js",
    "https://fonts.gstatic.com/s/playfairdisplay/v18/nuFiD-vYSZviVYUb_rj3ij__anPXDTzYgEM86xQ.woff2",
    "https://fonts.gstatic.com/s/playfairdisplay/v18/nuFkD-vYSZviVYUb_rj3ij__anPXDTnogkk7yRZrPA.woff2",
    "https://fonts.gstatic.com/s/playfairdisplay/v18/nuFlD-vYSZviVYUb_rj3ij__anPXBYf9lW4e5j5hNKc.woff2",
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.11.2/webfonts/fa-brands-400.woff2",
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.11.2/webfonts/fa-regular-400.woff2",
    "./manifest.json",
    "./images/josh256.png",
    "./images/josh128.png",
    "https://joshlipinski.com/favicon.ico"
  ];

  // https://stackoverflow.com/questions/37117933/service-workers-not-updating
  self.addEventListener('install', function(e) {
    e.waitUntil(
      Promise.all([caches.open(cache_v), self.skipWaiting()])
        .then(function(storage) {
          var static_cache = storage[0];
          return Promise.all(
            cache_list.map(function(url) {
              //loop through pre-fetch manually because addAll will fail
              return static_cache
                .add(url)
                .then(function(e) {
                  //successfully cached
                })
                .catch(function(e) {
                  console.log('failed fetch of ' + url);
                });
            })
          );
        })
        .catch(function(e) {
          //cache could not be initialized
        })
    );
  });

  // intercept network requests:
  self.addEventListener('fetch', function(event) {
    if (event.request.method !== 'GET') { return; } //do not allow serviceworker to handle POST/PUT/DELETE
    //handle asset request below:
    //first, handle specific exceptions, like api calls, which are not cached assets
    if (event.request.url.indexOf('http') !== 0) {
      //skip non-http requests, like chrome extension, etc
      console.log(event.request.url);
      return new Response('non-http request unsupported while offline', {
        headers: {'Content-Type': 'text/html'}
      });
    } else if ( //these are for GET requests to api endpoints that should not be cached - be specific and ensure any POST/PUT/DELETE endpoints are not here, otherwise the serviceworker will attempt to control them
      /\/api\//.test(event.request.url)
    ) {
      //api requests should always make a fetch attempt, NEVER cached
      event.respondWith(
        fetch(event.request).catch(function() {
          console.log('request not supported while offline.');
          return new Response('api unreachable', {
            headers: {'Content-Type': 'text/html'}
          });
        })
      );
    } else if (/\/index.html|\/$|[^\/]*\/[^\/|^\.]*$/.test(event.request.url)) { //this includes all routes to: /index.html, /, one slash and no "." [ex: /welcome is ok, but /manifest.json or /images/image are not]
      //always try to fetch from network first, since the file doesn't get hashed but the asset filenames will change
      event.respondWith(
        fetch(event.request).catch(function() {
          return caches.match("./", {ignoreSearch: true}); //in case of failure, always route to root
        })
      );
    } else {
      event.respondWith(
        caches
          .match(event.request, {ignoreSearch: true})
          .then(function(response) {
            //asset found in cache list

            if (response) {
              return response; //has already been cached! serve it.
            }

            //IMPORTANT: the case below should rarely happen since everything is being precached. but for the future, we may only want to precache the minimum.
            //has not been cached yet. fetch it, add it to cache.
            return fetch(event.request.clone())
              .then(function(response) {
                return caches
                  .open(cache_v)
                  .then(function(cache) {
                    cache.put(event.request.url, response.clone()); //add to cache
                    return response; //serve asset
                  })
                  .catch(function(e) {
                    //cache could not be opened
                  });
              })
              .catch(function(e) {
                //file not found, even though it's specified in the manifest. fix this by updating the manifest.
                console.log(
                  'sw manifest asset could not be fetched. ' + event.request.url
                );
                return new Response('not found', {
                  headers: {'Content-Type': 'text/html'}
                });
              });
          })
          .catch(function(e) {
            //fetch failed
            console.log(
              'you are offline and the asset you are attempting to fetch has not been previously cached. ' +
                event.request.url
            );
            return new Response('offline', {headers: {'Content-Type': 'text/html'}});
          })
      );
    }
  });

  // delete unused caches
  // https://stackoverflow.com/questions/37117933/service-workers-not-updating
  self.addEventListener('activate', function(e) {
    e.waitUntil(
      Promise.all([
        self.clients.claim(),
        caches.keys().then(function(cacheNames) {
          return Promise.all(
            cacheNames.map(function(cacheName) {
              if (cacheName !== cache_v) {
                console.log('deleting', cacheName);
                return caches.delete(cacheName);
              }
            })
          );
        })
      ])
    );
  });
})();
