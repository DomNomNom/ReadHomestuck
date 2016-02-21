// Generated by CoffeeScript 1.10.0
(function() {
  var _currentUrl, activateIframe, appendToCache, defaultSettings, defaultURL, focusElement, getCookie, getSetting, getTopLocation, inCache, main, makeHash, makeIframe, onScroll, onSettingsChanged, pollCurrentPage, prependToCache, removeFromCache, resetAllSettings, scroll, scrollAmount, sendMessageToIframe, setCookie, setLinks, setSetting, settingClamps, update, updateFromHash,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  defaultURL = 'http://www.mspaintadventures.com/?s=6&p=001901';

  defaultSettings = {
    'page-cache-size': 5,
    'minimal-ui': false,
    'sidebar-size': 20,
    'scroll-enabled': true,
    'scroll-duration': 400,
    'scroll-amount-percent': 60,
    'scroll-amount-pixel': -20
  };

  settingClamps = {
    'page-cache-size': [0, 20],
    'scroll-duration': [0, 10000],
    'sidebar-size': [1, 60]
  };

  getSetting = function(setting) {
    var defaultSetting, val;
    console.assert(!setting.startsWith('#'));
    console.assert(setting in defaultSettings);
    defaultSetting = defaultSettings[setting];
    switch (typeof defaultSetting) {
      case "number":
        val = parseInt($('#' + setting).val());
        if (isNaN(val)) {
          console.warn("using defaultSetting value for " + setting + " due to NaN from field");
          return defaultSettings[setting];
        }
        return val;
      case "boolean":
        return $('#' + setting).is(':checked');
      default:
        console.warn("requested setting is of a weird type: " + (typeof defaultSetting));
        return defaultSetting;
    }
  };

  setSetting = function(setting, value) {
    var defaultSetting;
    console.assert(!setting.startsWith('#'));
    console.assert(setting in defaultSettings);
    defaultSetting = defaultSettings[setting];
    console.assert((typeof value) === typeof defaultSetting);
    switch (typeof value) {
      case "number":
        return $('#' + setting).val(value);
      case "boolean":
        return $('#' + setting).prop('checked', value);
      default:
        console.warn("requested setting is of a weird type: " + (typeof defaultSetting));
        return defaultSetting;
    }
  };

  onSettingsChanged = function() {
    var defaultSetting, j, len, max, min, minMax, scrollEnabled, scrollSubSettings, setting, sideWidth;
    for (setting in settingClamps) {
      minMax = settingClamps[setting];
      min = minMax[0];
      max = minMax[1];
      if (getSetting(setting) > max) {
        setSetting(setting, max);
      }
      if (getSetting(setting) < min) {
        setSetting(setting, min);
      }
    }
    for (setting in defaultSettings) {
      defaultSetting = defaultSettings[setting];
      setCookie(setting, getSetting(setting));
    }
    scrollSubSettings = ['scroll-duration', 'scroll-amount-percent', 'scroll-amount-pixel'];
    scrollEnabled = getSetting('scroll-enabled');
    for (j = 0, len = scrollSubSettings.length; j < len; j++) {
      setting = scrollSubSettings[j];
      $('#' + setting).prop('disabled', !scrollEnabled);
    }
    $('#sidebar-size').prop('disabled', getSetting('minimal-ui'));
    if (getSetting('minimal-ui')) {
      $('#sidebar').addClass('minimal-ui');
      sideWidth = 40;
      $('#sidebar').width(sideWidth + 'px');
      $('#settings').css('right', sideWidth + 'px');
      return $('#cache-pages').width('100%');
    } else {
      $('#sidebar').removeClass('minimal-ui');
      sideWidth = getSetting('sidebar-size');
      $('#sidebar').width(sideWidth + '%');
      $('#settings').css('right', sideWidth + '%');
      return $('#cache-pages').width((100 - sideWidth) + '%');
    }
  };

  resetAllSettings = function() {
    var defaultSetting, setting;
    if (!window.confirm("Reset all settings?")) {
      return;
    }
    for (setting in defaultSettings) {
      defaultSetting = defaultSettings[setting];
      setSetting(setting, defaultSetting);
    }
    return onSettingsChanged();
  };

  setCookie = function(name, value) {
    var expiry;
    expiry = new Date();
    expiry.setDate(expiry.getDate() + 36000);
    return document.cookie = name + "=" + value + "; expires=" + (expiry.toUTCString());
  };

  getCookie = function(cookieName, defaultSetting) {
    var cookie, j, len, nameEquals, ref, value;
    if (defaultSetting == null) {
      defaultSetting = '';
    }
    nameEquals = cookieName + '=';
    ref = document.cookie.split(';');
    for (j = 0, len = ref.length; j < len; j++) {
      cookie = ref[j];
      cookie = cookie.trim();
      if (cookie.startsWith(nameEquals)) {
        value = cookie.substring(nameEquals.length).trim();
        switch (typeof defaultSetting) {
          case "string":
            return value;
          case "number":
            return parseInt(value);
          case "boolean":
            return value === "true";
          default:
            console.warn("defaultSetting for " + cookieName + " had a bad type: " + (typeof defaultSetting));
        }
      }
    }
    console.log("did not find cookie for name: " + cookieName);
    return defaultSetting;
  };

  _currentUrl = null;

  window.currentUrl = function() {
    return _currentUrl;
  };

  window.getIframeUnsafe = function(url) {
    return $(".stuckpage[src=\"" + url + "\"]");
  };

  window.getIframe = function(url) {
    var iframe;
    iframe = getIframeUnsafe(url);
    console.assert(iframe.length === 1);
    return iframe;
  };

  window.haveCurrentIframe = function() {
    return $('#current-page').length > 0;
  };

  window.getCurrentIframe = function() {
    var iframe;
    iframe = $('#current-page');
    console.assert(iframe.length === 1);
    return iframe;
  };

  inCache = function(url) {
    var numIframes;
    numIframes = getIframeUnsafe(url).length;
    console.assert((0 <= numIframes && numIframes <= 1));
    return numIframes > 0;
  };

  makeIframe = function(url) {
    return "<iframe class=\"stuckpage\" contentHeight=\"5\" src=\"" + url + "\"></iframe>";
  };

  window.onmessage = function(event) {
    var data;
    data = event.data;
    if (data.contentHeight) {
      getIframe(data.iframeSrc).attr('contentHeight', data.contentHeight);
    }
    if (getCurrentIframe().attr('src') === data.iframeSrc) {
      if (currentUrl() !== data.page) {
        _currentUrl = data.page;
        scroll(getTopLocation(currentUrl()));
        history.pushState({}, 'Better Homestuck', makeHash(currentUrl()));
        if (isHomestuckUrl(currentUrl())) {
          setCookie('hash', makeHash(currentUrl()));
        }
      }
      setLinks(data.page);
    }
    if (document.activeElement.tagName === 'IFRAME') {
      return focusElement().focus();
    }
  };

  focusElement = function() {
    if (pageRequiresKeyboard(currentUrl())) {
      return getCurrentIframe();
    }
    return document.getElementById('nextlink');
  };

  sendMessageToIframe = function(iframe, url) {
    var message;
    message = {
      'messagetype': 'your iframeSrc is',
      'iframeSrc': url
    };
    return iframe[0].contentWindow.postMessage(message, '*');
  };

  activateIframe = function(url) {
    var iframe;
    iframe = getIframe(url);
    return iframe.load(function() {
      return sendMessageToIframe(iframe, url);
    });
  };

  pollCurrentPage = function() {
    return sendMessageToIframe(getCurrentIframe(), getCurrentIframe().attr('src'));
  };

  prependToCache = function(url) {
    $('#cache-pages').prepend(makeIframe(url));
    return activateIframe(url);
  };

  appendToCache = function(url) {
    $('#cache-pages').append(makeIframe(url));
    return activateIframe(url);
  };

  removeFromCache = function(url) {
    return getIframe(url).remove();
  };

  update = function(targetUrl) {
    var cacheSize_forward, i, j, k, l, len, ref, ref1, url, urlsToCache;
    console.log('updating: ' + targetUrl);
    console.assert(isHomestuckUrl(targetUrl));
    urlsToCache = [targetUrl];
    url = targetUrl;
    cacheSize_forward = getSetting('page-cache-size');
    for (i = j = 0, ref = cacheSize_forward; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
      url = nextUrl(url);
      urlsToCache.push(url);
    }
    if (haveCurrentIframe() && getCurrentIframe().attr('src') !== currentUrl()) {
      console.log("removing iframe due to content change: " + (getCurrentIframe().attr('src')) + "  " + (currentUrl()));
      removeFromCache(getCurrentIframe().attr('src'));
    }
    for (i = k = ref1 = urlsToCache.length - 1; k >= 0; i = k += -1) {
      url = urlsToCache[i];
      if ((!inCache(url)) && inCache(nextUrl(url)) && !isFlashPage(url)) {
        prependToCache(url);
      }
    }
    if (isFlashPage(url)) {
      prependToCache(targetUrl);
    }
    for (l = 0, len = urlsToCache.length; l < len; l++) {
      url = urlsToCache[l];
      if ((!inCache(url)) && !isFlashPage(url)) {
        appendToCache(url);
      }
    }
    _currentUrl = targetUrl;
    $('#current-page').removeAttr('id');
    getIframe(targetUrl).attr('id', 'current-page');
    $('#hold-your-horses').detach().insertAfter(getIframe(targetUrl));
    $('.stuckpage').each(function() {
      url = $(this).attr('src');
      if (indexOf.call(urlsToCache, url) < 0 || (isFlashPage(url) && url !== targetUrl)) {
        return removeFromCache(url);
      }
    });
    document.title = 'Better Homestuck #' + getPageNumber(targetUrl);
    setLinks();
    return console.assert(inCache(currentUrl()));
  };

  scroll = function(topMaybe) {
    if (topMaybe != null) {
      $("html, body").stop();
      return $(window).scrollTop(topMaybe);
    } else {
      return $(window).scrollTop();
    }
  };

  getTopLocation = function(url) {
    if (url.startsWith('http://www.mspaintadventures.com/?s=6&p=')) {
      return 29;
    }
    return 0;
  };

  updateFromHash = function(hash) {
    var duration, hashParts, top, url;
    setCookie('hash', hash);
    hashParts = hash.split('#');
    url = defaultURL;
    if (hashParts.length > 1) {
      url = hashParts[1];
    }
    top = getTopLocation(url);
    if (hashParts.length > 2) {
      top = Math.max(top, parseInt(hashParts[2]));
    }
    if (url === currentUrl() || ((currentUrl() != null) && getPageNumber(url) === getPageNumber(currentUrl()))) {
      return $("html, body").animate({
        scrollTop: top
      }, duration = getSetting('scroll-duration'));
    } else {
      scroll(top);
      return update(url);
    }
  };

  makeHash = function(url, top) {
    var hash;
    if (!isHomestuckUrl(url)) {
      console.warn("url is not a homestuck url: " + url);
    }
    if (url.indexOf('#') >= 0) {
      console.warn('oh no! homestuck url has a hash in it: ' + url);
      url = url.split('#')[0];
    }
    hash = '#' + url;
    if (top != null) {
      hash += '#' + parseInt(Math.max(0, top));
    }
    return hash;
  };

  window.onpopstate = function(event) {
    console.log("popstate: " + document.location.hash);
    return updateFromHash(document.location.hash);
  };

  scrollAmount = function() {
    return (getSetting('scroll-amount-percent') / 100.0) * window.innerHeight + getSetting('scroll-amount-pixel');
  };

  setLinks = function(url) {
    var bottomMostScroll, contentBottom, nexthash, prevhash;
    if (url == null) {
      url = currentUrl();
    }
    contentBottom = parseInt(getCurrentIframe().attr('contentHeight')) - 15;
    bottomMostScroll = contentBottom + 5 - $(window).height();
    if (scroll() <= 30 || !getSetting('scroll-enabled')) {
      prevhash = makeHash(prevUrl(url));
    } else {
      prevhash = makeHash(url, Math.min(bottomMostScroll, scroll() - scrollAmount()));
    }
    if (scroll() + $(window).height() > contentBottom || !getSetting('scroll-enabled')) {
      nexthash = makeHash(nextUrl(url));
    } else {
      nexthash = makeHash(url, Math.min(bottomMostScroll, scroll() + scrollAmount()));
    }
    $('#prevlink').attr('href', prevhash);
    return $('#nextlink').attr('href', nexthash);
  };

  onScroll = function() {
    return setLinks();
  };

  main = function() {
    var defaultSetting, hash, setting, value;
    if (String.prototype.startsWith == null) {
      String.prototype.startsWith = function(str) {
        return this.indexOf(str) === 0;
      };
    }
    $('#settings-toggle').click(function() {
      return $('#settings').toggle();
    });
    $('#settings-reset-all').click(resetAllSettings);
    $(document).keydown(function(e) {
      switch (e.which) {
        case 37:
          return $('#prevlink')[0].click();
        case 39:
          return $('#nextlink')[0].click();
      }
    });
    for (setting in defaultSettings) {
      defaultSetting = defaultSettings[setting];
      console.assert($('#' + setting).length === 1);
      value = getCookie(setting, defaultSetting);
      console.assert((typeof value) === typeof defaultSetting);
      setSetting(setting, value);
    }
    onSettingsChanged();
    for (setting in defaultSettings) {
      defaultSetting = defaultSettings[setting];
      $('#' + setting).change(onSettingsChanged);
    }
    hash = document.location.hash;
    if (!(hash.startsWith('#') && isHomestuckUrl(hash.split('#')[1]))) {
      hash = getCookie('hash');
      if (hash === '') {
        hash = makeHash(defaultURL);
      }
    }
    updateFromHash(hash);
    setInterval(pollCurrentPage, 500);
    return $(window).scroll(onScroll);
  };

  main();

}).call(this);

//# sourceMappingURL=main.js.map
