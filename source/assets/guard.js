/* Güvenlik: site başka bir sitenin çerçevesi (iframe) içinde açılırsa kendi penceresine taşınır (clickjacking koruması). */
(function () {
  if (window.top !== window.self) {
    try { window.top.location = window.self.location.href; }
    catch (e) { document.documentElement.style.visibility = 'hidden'; }
  }
})();
