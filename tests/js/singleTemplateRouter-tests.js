// Tests for the "single template router".
//
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../../index");

var jqUnit = require("jqUnit");
var fs     = require("fs");
var path   = require("path");
var jsdom  = require("jsdom");

var jqueryPath = path.resolve(__dirname, "../../node_modules/infusion/src/lib/jquery/core/js/jquery.js");
var jqueryContent = fs.readFileSync(jqueryPath, "utf8");

var express = require("gpii-express");
express.loadTestingSupport();

var kettle = require("kettle");
kettle.loadTestingSupport();

var templateDir = path.resolve(__dirname, "../templates/primary");

fluid.registerNamespace("gpii.templates.tests.singleTemplateRouter");

// Verify the results of a request.  Accepts the following values:
//
// `response`: The native response returned by `kettle.request.http`.
//
// `body`: The request body returned by `kettle.request.http`
//
// `statusCode`: The numeric status code that is expected.
//
// `expected`: A map whose keys are jQuery selectors that correspond to a single element found in the page, and whose values
// are the expected trimmed output of the `text()` function for a given element, as in:
//
//  { "#myId": "These are my contents." }
//
// `notExpected`: An array of selectors that should either not be found or that should not contain any output.
//
gpii.templates.tests.singleTemplateRouter.verifyResults = function (response, body, statusCode, expected, notExpected) {
    jqUnit.assertEquals("The status code should be as expected...", statusCode, response.statusCode);


    jsdom.env({
        html: body,
        src:  [jqueryContent],
        done: function (err, window) {
            jqUnit.assertNull("There should be no errors...", err);

            if (expected) {
                fluid.each(expected, function (expectedValue, expectedSelector) {
                    var matchingElements = window.$(expectedSelector);
                    jqUnit.assertEquals("There should be exactly one matching element...", 1, matchingElements.length);

                    jqUnit.assertEquals("The text should be as expected...", expectedValue, matchingElements.text().trim());
                });
            }

            if (notExpected) {
                fluid.each(notExpected, function (notExpectedSelector) {
                    var matchingElements = window.$(notExpectedSelector);
                    jqUnit.assertTrue("The element should not be found...", matchingElements.length === 0);
                });
            }
        }
    });
};

fluid.defaults("gpii.templates.tests.singleTemplateRouter.request", {
    gradeNames: ["kettle.test.request.http"],
    port:       "{testEnvironment}.options.expressPort",
    path:       "{testEnvironment}.options.baseUrl"
});


fluid.defaults("gpii.templates.tests.singleTemplateRouter.caseHolder", {
    gradeNames: ["gpii.express.tests.caseHolder"],
    rawModules: [
        {
            tests: [
                {
                    name: "Confirm that a template is rendered without request data...",
                    type: "test",
                    sequence: [
                        {
                            func: "{noDataRequest}.send"
                        },
                        {
                            listener: "gpii.templates.tests.singleTemplateRouter.verifyResults",
                            event:    "{noDataRequest}.events.onComplete",
                            args:     ["{noDataRequest}.nativeResponse", "{arguments}.0", 200, false, ["#req-myvar"]]
                        }
                    ]
                },
                {
                    name: "Confirm that a template is rendered with request data...",
                    type: "test",
                    sequence: [
                        {
                            func: "{dataRequest}.send"
                        },
                        {
                            listener: "gpii.templates.tests.singleTemplateRouter.verifyResults",
                            event:    "{dataRequest}.events.onComplete",
                            args:     ["{dataRequest}.nativeResponse", "{arguments}.0", 200, {"#req-myvar": "query data"}]
                        }

                    ]
                }
            ]
        }
    ],
    components: {
        noDataRequest: {
            type: "gpii.templates.tests.singleTemplateRouter.request"
        },
        dataRequest: {
            type: "gpii.templates.tests.singleTemplateRouter.request",
            options: {
                path: {
                    expander: {
                        funcName: "fluid.stringTemplate",
                        args:     ["%baseUrl?myvar=query+data", { baseUrl: "{testEnvironment}.options.baseUrl"}]
                    }
                }
            }
        }
    }
});

fluid.defaults("gpii.templates.tests.singleTemplateRouter.environment", {
    gradeNames:  ["fluid.test.testEnvironment"],
    expressPort: 6494,
    baseUrl:     "http://localhost:6494/",
    events: {
        constructServer: null,
        onStarted:       null
    },
    components: {
        express: {
            type:          "gpii.express",
            createOnEvent: "constructServer",
            options: {
                config: {
                    express: {
                        port:    "{testEnvironment}.options.expressPort",
                        baseUrl: "{testEnvironment}.options.baseUrl",
                        views:   templateDir
                    }
                },
                components: {
                    urlencoded: {
                        type: "gpii.express.middleware.bodyparser.urlencoded"
                    },
                    singleTemplateRouter: {
                        type: "gpii.express.singleTemplateRouter",
                        options: {
                            templateKey: "pages/singleTemplateRouter"
                        }
                    },
                    handlebars: {
                        type: "gpii.express.hb"
                    }
                },
                listeners: {
                    "onStarted.notifyParent": {
                        func: "{testEnvironment}.events.onStarted.fire"
                    }
                }
            }
        },
        caseHolder: {
            type: "gpii.templates.tests.singleTemplateRouter.caseHolder"
        }
    }
});

// TODO: confirm working with `all-tests.js` and add any required boilerplate as needed
gpii.templates.tests.singleTemplateRouter.environment();