/**
 * notifier
 * A smaller version of alertify  -> http://fabien-d.github.com/alertify.js/
 * An unobtrusive customizable JavaScript notification system
 *
 * @author Fabien Doiron <fabien.doiron@gmail.com>
 * @copyright Fabien Doiron 2013
 * @license MIT <http://opensource.org/licenses/mit-license.php>
 * @link https://github.com/CynderR/alertify.js.git
 * @version 0.3.7
 */

(function (global, undefined) {
  "use strict";

  var document = global.document,
      notifier;

  notifier = function () {
    var _notifier = {},
        dialogs   = {},
        elCallee, elLog, getTransitionEvent;

    dialogs = {
      log     : "<article class=\"notifier-log{{class}}\">{{message}}</article>"
    };

    /**
     * Return the proper transitionend event
     * @return {String}    Transition type string
     */
    getTransitionEvent = function () {
      var t,
        el = document.createElement("fakeelement"),
        transitions = {
          "WebkitTransition" : "webkitTransitionEnd",
          "MozTransition"    : "transitionend",
          "OTransition"      : "otransitionend",
          "transition"       : "transitionend"
        };

      for (t in transitions) {
        if (el.style[t] !== undefined) return transitions[t];
      }
    };

    _notifier = {
      delay : 5000,
      transition : undefined,

      bind : function (el, event, fn) {
        if (typeof el.addEventListener === "function") {
          el.addEventListener(event, fn, false);
        } else if (el.attachEvent) {
          el.attachEvent("on" + event, fn);
        }
      },

      close : function (elem, wait) {
        // Unary Plus: +"2" === 2
        var timer = (wait && !isNaN(wait)) ? +wait : this.delay,
            self  = this,
            hideElement, transitionDone;

        // set click event on log messages
        this.bind(elem, "click", function () {
          hideElement(elem);
        });
        // Hide the dialog box after transition
        // This ensure it doens't block any element from being clicked
        transitionDone = function (event) {
          event.stopPropagation();
          // unbind event so function only gets called once
          self.unbind(this, self.transition, transitionDone);
          // remove log message
          elLog.removeChild(this);
          if (!elLog.hasChildNodes()) elLog.className += " notifier-logs-hidden";
        };
        // this sets the hide class to transition out
        // or removes the child if css transitions aren't supported
        hideElement = function (el) {
          // ensure element exists
          if (typeof el !== "undefined" && el.parentNode === elLog) {
            // whether CSS transition exists
            if (typeof self.transition !== "undefined") {
              self.bind(el, self.transition, transitionDone);
              el.className += " notifier-log-hide";
            } else {
              elLog.removeChild(el);
              if (!elLog.hasChildNodes()) elLog.className += " notifier-logs-hidden";
            }
          }
        };
        // never close (until click) if wait is set to 0
        if (wait === 0) return;
        // set timeout to auto close the log message
        setTimeout(function () { hideElement(elem); }, timer);
      },

      extend : function (type) {
        if (typeof type !== "string") throw new Error("extend method must have exactly one paramter");
        return function (message, wait) {
          this.log(message, type, wait);
          return this;
        };
      },

      init : function () {
        // ensure legacy browsers support html5 tags
        document.createElement("nav");
        document.createElement("article");
        document.createElement("section");

        // log element
        elLog = document.createElement("section");
        elLog.setAttribute("id", "notifier-logs");
        elLog.className = "notifier-logs notifier-logs-hidden";
        document.body.appendChild(elLog);

        // set transition type
        this.transition = getTransitionEvent();
        // clean up init method
        delete this.init;
      },

      log : function (message, type, wait) {
        // check to ensure the notifier dialog element
        // has been successfully created
        var check = function () {
          if (elLog && elLog.scrollTop !== null) return;
          else check();
        };
        // initialize notifier if it hasn't already been done
        if (typeof this.init === "function") {
          this.init();
          check();
        }
        elLog.className = "notifier-logs";
        this.notify(message, type, wait);
        return this;
      },

      /**
       * Add new log message
       * If a type is passed, a class name "notifier-log-{type}" will get added.
       * This allows for custom look and feel for various types of notifications.
       */
      notify : function (message, type, wait) {
        var log = document.createElement("article");
        log.className = "notifier-log" + ((typeof type === "string" && type !== "") ? " notifier-log-" + type : "");
        log.innerHTML = message;
        // prepend child
        elLog.insertBefore(log, elLog.firstChild);
        // triggers the CSS animation
        setTimeout(function() { log.className = log.className + " notifier-log-show"; }, 50);
        this.close(log, wait);
      },

      unbind : function (el, event, fn) {
        if (typeof el.removeEventListener === "function") {
          el.removeEventListener(event, fn, false);
        } else if (el.detachEvent) {
          el.detachEvent("on" + event, fn);
        }
      }
    };

    return {
      extend  : _notifier.extend,
      init    : _notifier.init,
      log     : function (message, type, wait) { _notifier.log(message, type, wait); return this; },
      success : function (message, wait) { _notifier.log(message, "success", wait); return this; },
      error   : function (message, wait) { _notifier.log(message, "error", wait); return this; }
    };
  };

  // AMD and window support
  if (typeof define === "function") {
    define([], function () { return new notifier(); });
  } else if (typeof global.notifier === "undefined") {
    global.notifier = new notifier();
  }

}(this));
