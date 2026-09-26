/* Lightweight same-document navigation for static Jekyll pages. */
(function () {
  "use strict";

  var navigationSelector = "a[data-page-navigation]";
  var requestController;

  function normalizePath(pathname) {
    return pathname.replace(/\/+$/, "") || "/";
  }

  function updateActiveNavigation() {
    var currentPath = normalizePath(window.location.pathname);
    document.querySelectorAll(navigationSelector).forEach(function (link) {
      var linkPath = normalizePath(new URL(link.href, window.location.origin).pathname);
      var isCurrent = linkPath === currentPath;
      link.classList.toggle("is-active", isCurrent);
      if (isCurrent) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function enhanceExternalLinks(root) {
    root.querySelectorAll('a[href^="http://"], a[href^="https://"]').forEach(function (link) {
      if (link.origin !== window.location.origin) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
    });
  }

  function announce(message) {
    var status = document.getElementById("site-status");
    if (status) {
      status.textContent = message;
    }
  }

  function getContentContainer(root) {
    return root.querySelector(":scope > .page, :scope > .archive");
  }

  function updateDocument(url, options) {
    var previousMain = document.getElementById("main");
    var previousContent = previousMain && getContentContainer(previousMain);
    if (!previousMain || !previousContent) {
      window.location.assign(url);
      return;
    }

    if (requestController) {
      requestController.abort();
    }
    requestController = new AbortController();
    previousContent.classList.add("is-loading");
    announce("Loading page");

    fetch(url, {
      signal: requestController.signal,
      headers: { "X-Requested-With": "partial-navigation" }
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Page request failed");
        }
        return response.text();
      })
      .then(function (html) {
        var parsed = new DOMParser().parseFromString(html, "text/html");
        var nextMain = parsed.getElementById("main");
        var nextContent = nextMain && getContentContainer(nextMain);
        if (!nextContent) {
          throw new Error("Page content was not found");
        }

        document.title = parsed.title || document.title;
        previousContent.replaceWith(nextContent);
        enhanceExternalLinks(nextContent);

        if (options.pushState) {
          window.history.pushState({}, "", url);
        }
        updateActiveNavigation();

        var targetId = new URL(url, window.location.origin).hash.slice(1);
        var target = targetId ? document.getElementById(targetId) : document.getElementById("main");
        if (target) {
          target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
          target.scrollIntoView({ block: "start", behavior: "auto" });
        }
        announce(document.title + " loaded");
      })
      .catch(function (error) {
        if (error.name !== "AbortError") {
          window.location.assign(url);
        }
      })
      .finally(function () {
        requestController = undefined;
        var currentMain = document.getElementById("main");
        var currentContent = currentMain && getContentContainer(currentMain);
        if (currentContent) {
          currentContent.classList.remove("is-loading");
        }
      });
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest(navigationSelector);
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    if (link.target || link.hasAttribute("download")) {
      return;
    }

    var url = new URL(link.href, window.location.origin);
    if (url.origin !== window.location.origin) {
      return;
    }
    if (normalizePath(url.pathname) === normalizePath(window.location.pathname) && url.hash) {
      return;
    }

    event.preventDefault();
    updateDocument(url.href, { pushState: true });
  }, true);

  window.addEventListener("popstate", function () {
    updateDocument(window.location.href, { pushState: false });
  });

  document.addEventListener("DOMContentLoaded", function () {
    enhanceExternalLinks(document);
    updateActiveNavigation();
  });
}());
