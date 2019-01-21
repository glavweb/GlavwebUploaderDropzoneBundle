/**
 * jQuery object
 * @external jQuery
 * @see {@link http://api.jquery.com/jQuery/}
 */

/**
 * DropzoneUploader
 *
 * @author Andrey Nilov <nilov@glavweb.ru>
 */
(function( $ ){
    function DropzoneUploader(selector, options) {
        var self = this;

        options = $.extend({
            url:               null,
            previewsContainer: null,
            previewTemplate:   null,
            deleteUrl:         null,
            requestId:         null,
            maxFiles:          null,
            thumbnailWidth    : 480,
            thumbnailHeight   : 360,
            messages : {
                dictMaxFilesExceeded: "You can't download files more than",
                serverError: 'An error occurred on the server.'
            }
        }, options);

        var dropzone = new Dropzone(selector, {
            url                  : options.url,
            previewsContainer    : options.previewsContainer,
            previewTemplate      : options.previewTemplate,
            maxFiles             : options.maxFiles,
            thumbnailWidth       : options.thumbnailWidth,
            thumbnailHeight      : options.thumbnailHeight,
            dictMaxFilesExceeded : options.messages.dictMaxFilesExceeded + ' ' + options.maxFiles,
            error: function (file, message) {
                var errorText = options.messages.serverError;

                if (file.previewElement) {
                    var $previewElement = $(file.previewElement);

                    if (typeof message !== "String" && message.error) {
                        errorText = message.error;
                    }

                    $previewElement.find('.error').text(errorText);
                }
            }
        });

        this.progressFiles = 0;

        dropzone.on("removedfile", function (file) {
            if (file.response !== undefined && file.response.id !== undefined) {
                var id  = file.response.id;
                var url = options.deleteUrl;

                $.post(url, {
                    id:         id,
                    request_id: options.requestId
                });
            }
        });

        dropzone.on("sending", function (file, response, formData) {
            formData.append('request_id', options.requestId);

            self.progressFiles += 1;
        });

        dropzone.on("success", function(file, response) {
            file.response = response;
        });

        dropzone.on("complete", function(file, response) {
            self.progressFiles -= 1;
        });

        this.dropzone = dropzone;
    }

    DropzoneUploader.prototype.addFile = function(id, name, size, thumbnailPath) {
        var mockFile = {
            name: name,
            size: size,
            accepted: true,
            response: {
                id: id
            }
        };

        this.dropzone.emit('addedfile', mockFile);

        if (thumbnailPath !== undefined) {
            this.dropzone.emit("thumbnail", mockFile, thumbnailPath);
        }

        return mockFile;
    };

    DropzoneUploader.prototype.isProgress = function(h) {
        return this.progressFiles > 0;
    };

    // Init plugin
    $.fn.dropzoneUploader = function (options) {
        return new DropzoneUploader(this.selector, options);
    };

})( jQuery );
