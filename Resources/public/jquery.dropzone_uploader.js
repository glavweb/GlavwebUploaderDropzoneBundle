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
        }, options);

        var acceptedFilesString = $.isArray(options.acceptedFiles) ? options.acceptedFiles.join(',') : options.acceptedFiles;

        var dropzone = new Dropzone(selector, $.extend({
            url                  : options.url,
            previewsContainer    : options.previewsContainer,
            previewTemplate      : options.previewTemplate,
            maxFiles             : options.maxFiles,
            maxFilesize          : options.maxFilesize,
            acceptedFiles        : acceptedFilesString,
            thumbnailWidth       : options.thumbnailWidth,
            thumbnailHeight      : options.thumbnailHeight,
            error: function (file, message, request) {
                if (file.previewElement) {
                    var $previewElement = $(file.previewElement)
                    var errorText = message;

                    if (request) {
                        if (typeof message === "object" && 'error' in message) {
                            errorText = message.error;
                        } else {
                            errorText = this.options.dictResponseError.replace("{{statusCode}}", request.status);
                        }
                    }

                    $previewElement.addClass("dz-error");
                    $previewElement.find("[data-dz-errormessage]").text(errorText);
                }
            }
        }, options.chunking, options.messages));

        this.progressFiles = 0;

        dropzone.on("addedfile", function (file, mock) {
            var $previewElement = $(file.previewElement)
            var removeLabelText = mock ? this.options.dictRemoveFile : this.options.dictCancelUpload;

            $previewElement.find('[data-gwu-remove-label]').text(removeLabelText);
        });

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
            formData.append('type', file.type);

            if (file.width !== undefined) {
                formData.append('image_width', file.width);
            }

            if (file.height !== undefined) {
                formData.append('image_height', file.height);
            }

            self.progressFiles += 1;
        });

        dropzone.on("success", function(file, response) {
            file.response = response;
        });

        dropzone.on("complete", function(file, response) {
            var $previewElement = $(file.previewElement);

            $previewElement.find('[data-gwu-remove-label]').text(this.options.dictRemoveFile);

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

        this.dropzone.emit('addedfile', mockFile, true);

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
