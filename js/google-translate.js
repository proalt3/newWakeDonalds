// Real-time page translation via Google Translate (no per-phrase translation file)
(function () {
  window.googleTranslateElementInit = function () {
    if (window.google && window.google.translate && window.google.translate.TranslateElement) {
      new google.translate.TranslateElement({
        pageLanguage: "en",
        includedLanguages: "en,es,fr,de,zh-CN,zh-TW,ar,hi,pt,ja,ko",
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false,
      }, "google_translate_element");
    }
  };
  var s = document.createElement("script");
  s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  s.async = true;
  document.head.appendChild(s);
})();
