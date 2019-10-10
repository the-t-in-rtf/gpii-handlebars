/*

    A handlebars helper that interpolates variable content into i18n/l10n message strings and produces string output.

    See the docs for details: https://github.com/GPII/gpii-handlebars/blob/master/docs/i18n.md

 */
/* eslint-env node */
"use strict";
var fluid  = fluid || require("infusion");
var gpii   = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.handlebars.helper.messageHelper");

fluid.registerNamespace("gpii.handlebars.helper.messageHelper");

/**
 *
 * Look up and render a single i18n string template ("message").  Used by both the client and server implementation.
 *
 * @param {Object} messages - A map of i18n keys and string templates.
 * @param {String} messageKey - The i18n key for our specific message.
 * @param {Object} dataOrRootContext - Depending on how Handlebars is called, either a data payload, or the root context.
 * @param {Object} rootContext - If the helper is called with three arguments, this will be the root context.
 * @return {String} - The plain text of the i18n template with all variable references replaced with data.
 *
 */
gpii.handlebars.helper.messageHelper.resolveMessage = function (messages, messageKey, dataOrRootContext, rootContext) {
    // If we have a third argument, then the second argument is our "data".  Otherwise, we use the root context (equivalent to passing "." as the variable).
    var data = rootContext ? dataOrRootContext : fluid.get(dataOrRootContext, "data.root");

    var messageTemplate = fluid.get(messages, messageKey);
    if (messageTemplate) {
        return fluid.stringTemplate(messageTemplate, data);
    }
    else {
        return "[Message string for key " + messageKey + " not found]";
    }
};

gpii.handlebars.helper.messageHelper.getHelper = function (that) {
    return function (messageKey, dataOrRootContext, rootContext) {
        if (arguments.length < 2) {
            fluid.fail("You must call the 'messageHelper' helper with at least a message key.");
        }
        else {
            return that.resolveMessage(messageKey, dataOrRootContext, rootContext);
        }
    };
};

fluid.defaults("gpii.handlebars.helper.messageHelper", {
    gradeNames: ["gpii.handlebars.helper"],
    helperName: "messageHelper",
    model: {
        messages: {}
    },
    invokers: {
        "getHelper": {
            "funcName": "gpii.handlebars.helper.messageHelper.getHelper",
            "args":     ["{that}"]
        },
        "resolveMessage": {
            funcName: "fluid.notImplemented"
        }
    }
});
