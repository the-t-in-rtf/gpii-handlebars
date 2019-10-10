/*

  A base grade for components that make use of the Handlebars client to render their content.  To use this in a
  component, you will need to:

  1. Pass in a `templateUrl` option that points to a REST interface from which the template content can be retrieved.
     See the `inline` server-side component for an example of the output required.

  2. Replace the `renderInitialMarkup` invoker with your own implementation, that should replace selected view content
     using the `templates` component.  Replace this with an empty function if you want to disable the initial render
     once template content is loaded.

     This grade provides a convenience invoker that you can use when defining your `renderMarkup` controller, as in:

     renderInitialMarkup: {
        func: "{that}.renderMarkup",
        args: [
          "{that}",
          "{that}.options.selectors.selector",
          "{that}.options.templateKey",
          "{that}.model",
          "appendTo"
        ]
      }

  For an example of using this in depth, check out the provided `templateFormControl` grade or the client side tests.
 */
/* eslint-env browser */
(function (fluid) {
    "use strict";
    var gpii = fluid.registerNamespace("gpii");
    fluid.registerNamespace("gpii.handlebars.templateAware");

    // A convenience function that can be used to more easily define `renderInitialMarkup` invokers (see example above).
    gpii.handlebars.templateAware.renderMarkup = function (that, renderer, selector, templateKey, data, manipulator) {
        manipulator = manipulator ? manipulator : "html";
        var element = that.locate(selector);
        if (renderer) {
            renderer[manipulator](element, templateKey, data);
            that.events.onMarkupRendered.fire(that);
        }
        else {
            fluid.fail("I cannot render content without a renderer.");
        }
    };

    gpii.handlebars.templateAware.refreshDom = function (that) {
        // Adapted from: https://github.com/fluid-project/infusion/blob/master/src/framework/preferences/js/Panels.js#L147
        var userJQuery = that.container.constructor;
        that.container = userJQuery(that.container.selector, that.container.context);
        // fluid.initDomBinder(that, that.options.selectors);
        that.dom.clear();
        that.events.onDomChange.fire(that);
    };

    fluid.defaults("gpii.handlebars.templateAware", {
        gradeNames: ["gpii.binder.bindOnDomChange", "fluid.viewComponent"],
        events: {
            refresh: null,
            onMarkupRendered: null,
            onRendererAvailable: null
        },
        listeners: {
            "refresh.renderMarkup": {
                func: "{that}.renderInitialMarkup"
            },
            "onRendererAvailable.renderInitialMarkup": {
                func: "{that}.renderInitialMarkup"
            },
            "onMarkupRendered.refreshDom": {
                funcName: "gpii.handlebars.templateAware.refreshDom",
                args:     ["{that}"]
            }
        },
        invokers: {
            renderInitialMarkup: {
                funcName: "fluid.notImplemented"
            },
            renderMarkup: {
                funcName: "gpii.handlebars.templateAware.renderMarkup",
                args:     ["{that}", "{renderer}", "{arguments}.0", "{arguments}.1", "{arguments}.2", "{arguments}.3"] // renderer, selector, templateKey, data, manipulator
            }
        }
    });

    fluid.defaults("gpii.handlebars.templateAware.standalone", {
        gradeNames: ["gpii.handlebars.templateAware"],
        model: {
            templates: "{that}.options.templates",
            messages: {}
        },
        mergePolicy: {
            "templates.layouts":  "noexpand",
            "templates.pages":    "noexpand",
            "templates.partials": "noexpand"
        },
        components: {
            renderer: {
                type: "gpii.handlebars.renderer",
                options: {
                    listeners: {
                        "onCreate.notifyParent": {
                            func: "{gpii.handlebars.templateAware}.events.onRendererAvailable.fire"
                        }
                    },
                    model: {
                        templates: "{gpii.handlebars.templateAware.standalone}.model.templates",
                        messages: "{gpii.handlebars.templateAware.standalone}.model.messages"
                    }
                }
            }
        }
    });

    fluid.defaults("gpii.handlebars.templateAware.serverResourceAware", {
        gradeNames: ["gpii.handlebars.serverResourceAware", "gpii.handlebars.templateAware"],
        components: {
            renderer: {
                options: {
                    listeners: {
                        "onCreate.notifyParent": {
                            func: "{gpii.handlebars.templateAware}.events.onRendererAvailable.fire"
                        }
                    }
                }
            }
        }
    });
})(fluid);
