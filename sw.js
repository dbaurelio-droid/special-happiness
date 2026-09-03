// Meus Potinhos - cache do app para funcionar sem internet.
// Troque a versao sempre que o index.html mudar.
var VERSAO = "meus-potinhos-v1";
var ARQUIVOS = [
  "./", "./index.html", "./manifest.webmanifest"
];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(VERSAO).then(function(c){ return c.addAll(ARQUIVOS); }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.map(function(k){ return k === VERSAO ? null : caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

// Rede primeiro para o HTML (pega atualizacoes), cache primeiro para o resto.
self.addEventListener("fetch", function(e){
  var req = e.request;
  if (req.method !== "GET") return;
  var aceita = req.headers.get("accept") || "";
  if (req.mode === "navigate" || aceita.indexOf("text/html") > -1) {
    e.respondWith(
      fetch(req).then(function(r){
        var copia = r.clone();
        caches.open(VERSAO).then(function(c){ c.put(req, copia); });
        return r;
      }).catch(function(){
        return caches.match(req).then(function(r){ return r || caches.match("./index.html"); });
      })
    );
    return;
  }
  e.respondWith(caches.match(req).then(function(r){
    return r || fetch(req).then(function(net){
      if (net && net.status === 200 && net.type === "basic") {
        var copia = net.clone();
        caches.open(VERSAO).then(function(c){ c.put(req, copia); });
      }
      return net;
    }).catch(function(){ return r; });
  }));
});
