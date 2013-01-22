/**
 * alertify-loger
 * A smaller version of alertify  -> http://fabien-d.github.com/alertify.js/
 * An unobtrusive customizable JavaScript notification system
 *
 * @author Fabien Doiron <fabien.doiron@gmail.com>
 * @copyright Fabien Doiron 2013
 * @license MIT <http://opensource.org/licenses/mit-license.php>
 * @link http://fabien-d.github.com/alertify.js/
 * @module alertify
 * @version 0.3.7
 */

/*global define*/
(function (global, undefined) {
  "use strict";

  var document = global.document,
      Alertify;

  Alertify = function () {

    var _alertify = {},
        dialogs   = {},
        elCallee, elLog, getTransitionEvent;

    /**
     * Markup pieces
     * @type {Object}
     */
    dialogs = {
      log     : "<article class=\"alertify-log{{class}}\">{{message}}</article>"
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

    /**
     * Alertify private object
     * @type {Object}
     */
    _alertify = {

      /**
       * Delay number
       * @type {Number}
       */
      delay : 5000,

      /**
       * Set the transition event on load
       * @type {[type]}
       */
      transition : undefined,

      /**
       * Bind events to elements
       *
       * @param  {Object}   el       HTML Object
       * @param  {Event}    event    Event to attach to element
       * @param  {Function} fn       Callback function
       *
       * @return {undefined}
       */
      bind : function (el, event, fn) {
        if (typeof el.addEventListener === "function") {
          el.addEventListener(event, fn, false);
        } else if (el.attachEvent) {
          el.attachEvent("on" + event, fn);
        }
      },

      /**
       * Close the log messages
       *
       * @param  {Object} elem    HTML Element of log message to close
       * @param  {Number} wait    [optional] Time (in ms) to wait before automatically hiding the message, if 0 never hide
       *
       * @return {undefined}
       */
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
          if (!elLog.hasChildNodes()) elLog.className += " alertify-logs-hidden";
        };
        // this sets the hide class to transition out
        // or removes the child if css transitions aren't supported
        hideElement = function (el) {
          // ensure element exists
          if (typeof el !== "undefined" && el.parentNode === elLog) {
            // whether CSS transition exists
            if (typeof self.transition !== "undefined") {
              self.bind(el, self.transition, transitionDone);
              el.className += " alertify-log-hide";
            } else {
              elLog.removeChild(el);
              if (!elLog.hasChildNodes()) elLog.className += " alertify-logs-hidden";
            }
          }
        };
        // never close (until click) if wait is set to 0
        if (wait === 0) return;
        // set timeout to auto close the log message
        setTimeout(function () { hideElement(elem); }, timer);
      },

      /**
       * Extend the log method to create custom methods
       *
       * @param  {String} type    Custom method name
       *
       * @return {Function}
       */
      extend : function (type) {
        if (typeof type !== "string") throw new Error("extend method must have exactly one paramter");
        return function (message, wait) {
          this.log(message, type, wait);
          return this;
        };
      },

      /**
       * Initialize Alertify
       * Create the 2 main elements
       *
       * @return {undefined}
       */
      init : function () {
        // ensure legacy browsers support html5 tags
        document.createElement("nav");
        document.createElement("article");
        document.createElement("section");

        // log element
        elLog = document.createElement("section");
        elLog.setAttribute("id", "alertify-logs");
        elLog.className = "alertify-logs alertify-logs-hidden";
        document.body.appendChild(elLog);

        // set transition type
        this.transition = getTransitionEvent();
        // clean up init method
        delete this.init;
      },

      /**
       * Show a new log message box
       *
       * @param  {String} message    The message passed from the callee
       * @param  {String} type       [Optional] Optional type of log message
       * @param  {Number} wait       [Optional] Time (in ms) to wait before auto-hiding the log
       *
       * @return {Object}
       */
      log : function (message, type, wait) {
        // check to ensure the alertify dialog element
        // has been successfully created
        var check = function () {
          if (elLog && elLog.scrollTop !== null) return;
          else check();
        };
        // initialize alertify if it hasn't already been done
        if (typeof this.init === "function") {
          this.init();
          check();
        }
        elLog.className = "alertify-logs";
        this.notify(message, type, wait);
        return this;
      },

      /**
       * Add new log message
       * If a type is passed, a class name "alertify-log-{type}" will get added.
       * This allows for custom look and feel for various types of notifications.
       *
       * @param  {String} message    The message passed from the callee
       * @param  {String} type       [Optional] Type of log message
       * @param  {Number} wait       [Optional] Time (in ms) to wait before auto-hiding
       *
       * @return {undefined}
       */
      notify : function (message, type, wait) {
        var log = document.createElement("article");
        log.className = "alertify-log" + ((typeof type === "string" && type !== "") ? " alertify-log-" + type : "");
        log.innerHTML = message;
        // prepend child
        elLog.insertBefore(log, elLog.firstChild);
        // triggers the CSS animation
        setTimeout(function() { log.className = log.className + " alertify-log-show"; }, 50);
        this.close(log, wait);
      },

      /**
       * Unbind events to elements
       *
       * @param  {Object}   el       HTML Object
       * @param  {Event}    event    Event to detach to element
       * @param  {Function} fn       Callback function
       *
       * @return {undefined}
       */
      unbind : function (el, event, fn) {
        if (typeof el.removeEventListener === "function") {
          el.removeEventListener(event, fn, false);
        } else if (el.detachEvent) {
          el.detachEvent("on" + event, fn);
        }
      }
    };

    return {
      extend  : _alertify.extend,
      init    : _alertify.init,
      log     : function (message, type, wait) { _alertify.log(message, type, wait); return this; },
      success : function (message, wait) { _alertify.log(message, "success", wait); return this; },
      error   : function (message, wait) { _alertify.log(message, "error", wait); return this; }
    };
  };

  // AMD and window support
  if (typeof define === "function") {
    define([], function () { return new Alertify(); });
  } else if (typeof global.alertify === "undefined") {
    global.alertify = new Alertify();
  }

}(this));
