/**
 * Its an ajaxTransport of Jquery library that allow to submit form
 *
 * v1.1
 *
 * Submit ajax like form along with file input
 *
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 *
 * @Author: Roni Kumar Saha (roni.cse@gmail.com)
 * Mobile: 01817087873
 * https://github.com/xiidea/jquery-form-transport
 *
 * Please use as you wish at your own risk.
 */

(function (factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // Register as an anonymous AMD module:
        define(['jquery'], factory);
    } else {
        // Browser globals:
        factory(window.jQuery);
    }
}(function ($) {
    'use strict';

    var getScriptBase = (function() {
        var scripts = document.getElementsByTagName('script');
        var index = scripts.length - 1;
        var myScript = scripts[index];
        return "/" + myScript.src.substring( 0, myScript.src.lastIndexOf( "/" ) + 1).split("/").slice(3).join("/");
    })();

    var counter = 0;

    var re = /([^&=]+)=?([^&]*)/g;
    var decode = function(str) {
        return decodeURIComponent(str.replace(/\+/g, ' '));
    };

    var parseParams = function(query) {
        var params = {}, e;
        if (query) {
            if (query.substr(0, 1) == '?') {
                query = query.substr(1);
            }

            while (e = re.exec(query)) {
                var k = decode(e[1]);
                var v = decode(e[2]);
                if (params[k] !== undefined) {
                    if (!$.isArray(params[k])) {
                        params[k] = [params[k]];
                    }
                    params[k].push(v);
                } else {
                    params[k] = v;
                }
            }
        }
        return params;
    };


    //  The form transport accepts three additional options:
    //  can be a string or an array of strings.
    //  options.formData: an objects,
    //  { name: "value", name2: "value2"}
    $.ajaxTransport('form', function (options) {

        var form, formAsUrl = false;
        if(typeof options.form != 'undefined'){
            if(typeof options.form == 'string'){
                form = $("#"+options.form);
            }else{
                form = options.form;
            }
        }else{
            form = $("#"+options.url) || false
            formAsUrl = true;
        }

        if(form.length){
            if ( form[0].nodeName.toUpperCase() != 'FORM'){
                throw new Error("Please make sure that you're passing a valid form element");
            }

            options.form = form;
            if(formAsUrl){
                options.url = form.attr('action');
            }
        }else{
            form = false;
        }


        if (form) {
            var iframe,
                iframeHolder,
                iframeInputsHolder,
                formAction,
                formMethod,
                formEnctype,
                formEncoding,
                xdm_formSubmitted,
                sameDomainRestored,
                formTarget;

            formAction = form.attr('action') || "";
            formMethod = form.attr('method') || "";
            formTarget = form.attr('target') || "";
            formEnctype = form.attr('enctype') || "";
            formEncoding = form.attr('encoding') || "";
            sameDomainRestored = false;
            xdm_formSubmitted = false;

            if(options.crossDomain){
                options.localResource = options.localResource || getScriptBase + "blank.html";
            }

            return {
                send: function (_, completeCallback) {
                    form.attr('accept-charset', options.formAcceptCharset);


                    options.type = 'POST';

                    iframeHolder = $('<div>').hide();
                    // javascript:false as initial iframe src
                    // prevents warning popups on HTTPS in IE6.
                    // IE versions below IE8 cannot set the name property of
                    // elements that have already been added to the DOM,
                    // so we set the name along with the iframe HTML markup:
                    iframe = $(
                        '<iframe src="javascript:false;" name="iframe-transport-' +
                            (counter += 1) + '"></iframe>'
                    ).bind('load', function () {
                            iframe
                                .unbind('load')
                                .bind('load', function () {
                                    var response;

                                    // Wrap in a try/catch block to catch exceptions thrown
                                    // when trying to access cross-domain iframe contents:
                                    //If this is the initial response from the POST, we are still in the POST server's domain
                                    if(xdm_formSubmitted && !sameDomainRestored)
                                    {
                                        //console.log('form submitted');
                                        //Now you know we're about to restore the local domain right?
                                        sameDomainRestored = true;
                                        //localResourceUrl is passed by the calling page and points to a local empty page
                                        iframe[0].contentWindow.location = options.localResource;
                                        return false;
                                    }
                                    //If the form was submitted and we have loaded data from our own domain, we are good. Thank you for coming
                                    //and here is your data! It's gonna be 5 dollars, Thank you!
                                    else if(xdm_formSubmitted && sameDomainRestored)
                                    {
                                        response=iframe[0].contentWindow.name;
                                        sameDomainRestored = false;
                                        xdm_formSubmitted = false;
                                        if(!response){
                                            response="";
                                        }
                                    }else{
                                        try {
                                            response = iframe.contents();
                                            // Google Chrome and Firefox do not throw an
                                            // exception when calling iframe.contents() on
                                            // cross-domain requests, so we unify the response:
                                            if (!response.length || !response[0].firstChild) {
                                                throw new Error();
                                            }
                                        } catch (e) {
                                            response = undefined;
                                        }
                                    }

                                    // The complete callback returns the
                                    // iframe content document as response object:
                                    completeCallback(
                                        200,
                                        'success',
                                        {'form': response}
                                    );

                                    form
                                        .prop('target', formTarget)
                                        .prop('action', formAction)
                                        .prop('enctype', formEnctype)
                                        .prop('encoding', formEncoding)
                                        .prop('method', formMethod);

                                    // Fix for IE endless progress bar activity bug
                                    // (happens on form submits to iframe targets):
                                    $('<iframe src="javascript:false;"></iframe>')
                                        .appendTo(iframeHolder);
                                    iframeHolder.remove();
                                    if (iframeInputsHolder) {
                                        iframeInputsHolder.remove();
                                    }
                                });
                            form
                                .prop('target', iframe.prop('name'))
                                .prop('action', options.url)
                                .prop('method', options.type)
                                .prop('enctype', 'multipart/form-data')
                                // enctype must be set as encoding for IE:
                                .prop('encoding', 'multipart/form-data');

                            var formData = $.extend(parseParams(options.data), options.formData)

                            if (formData) {
                                iframeInputsHolder = $('<div>')
                                    .hide()
                                    .appendTo(form);

                                $.each(formData, function (name, value) {
                                    $('<input type="hidden"/>')
                                        .prop('name', name)
                                        .val(value)
                                        .appendTo(iframeInputsHolder);
                                });
                            }
                            xdm_formSubmitted = options.crossDomain;

                            if (typeof form[0].submit == 'object') {
                                var span = $(form[0].submit).wrap('<span/>').parent('span');
                                var submit_button = $(form[0].submit).clone(true);
                                $(form[0].submit).remove();
                                form[0].submit();
                                span.append(submit_button);
                                submit_button.unwrap();
                            } else {
                                form[0].submit();
                            }

                        });
                    iframeHolder.append(iframe).appendTo(document.body);
                },
                abort: function () {
                    if (iframe) {
                        // javascript:false as iframe src aborts the request
                        // and prevents warning popups on HTTPS in IE6.
                        // concat is used to avoid the "Script URL" JSLint error:
                        iframe
                            .unbind('load')
                            .prop('src', 'javascript'.concat(':false;'));
                    }
                    if (iframeInputsHolder) {
                        iframeInputsHolder.remove();
                    }
                    if (iframeHolder) {
                        iframeHolder.remove();
                    }
                    form
                        .prop('target', formTarget)
                        .prop('action', formAction)
                        .prop('enctype', formEnctype)
                        .prop('encoding', formEncoding)
                        .prop('method', formMethod);
                }
            };
        }
    });

    // The form transport returns the iframe content document as response.
    // The following adds converters from "iframe content" to text, json, html, and script:
    $.ajaxSetup({
        converters: {
            'form text': function (iframe) {
                return iframe && ($(iframe[0].body).text() || iframe);
            },
            'form json': function (iframe) {
                return iframe && $.parseJSON(($(iframe[0].body).text() || iframe));
            },
            'form html': function (iframe) {
                return iframe && ($(iframe[0].body).html() || iframe);
            },
            'form script': function (iframe) {
                return iframe && $.globalEval(($(iframe[0].body).text() || iframe));
            }
        }
    });

}));