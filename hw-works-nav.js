/* Scroll an inner page to the works directory, keeping the sticky header. */
(function () {
  var link = document.querySelector(".hw-footer-home");
  var works = document.getElementById("works");
  if (!link || !works) return;

  function headerHeight() {
    var header = document.querySelector(".hw-top");
    return header ? header.getBoundingClientRect().height : 0;
  }

  function scrollToWorks(smooth) {
    var fits = works.offsetHeight + headerHeight() < window.innerHeight;
    works.scrollIntoView({
      block: fits ? "end" : "start",
      behavior: smooth ? "smooth" : "auto"
    });
  }

  link.addEventListener("click", function (e) {
    e.preventDefault();
    scrollToWorks(true);
    if (history.replaceState) history.replaceState(null, "", "#works");
  });

  if (location.hash === "#works") {
    var revealed = window.SiteLoader && window.SiteLoader.revealed
      ? window.SiteLoader.revealed
      : Promise.resolve();
    revealed.then(function () { requestAnimationFrame(function () { scrollToWorks(false); }); });
  }
})();
