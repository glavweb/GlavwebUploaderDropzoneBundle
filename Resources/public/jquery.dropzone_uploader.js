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
    function isInteger(value) {
        return typeof value === 'number' && value % 1 === 0
    }

    function DropzoneUploader($element, options) {
        const self = this;

        options = $.extend({
            url:               null,
            previewsContainer: null,
            previewTemplate:   null,
            deleteUrl:         null,
            requestId:         null,
            maxFiles:          null,
            maxFilesize:       null,
            width:             null,
            height:            null,
            thumbnailWidth    : 480,
            thumbnailHeight   : 360,
        }, options);

        const acceptedFilesString = $.isArray(options.acceptedFiles) ? options.acceptedFiles.join(',') : options.acceptedFiles;

        $element.dropzone($.extend({
            url                  : options.url,
            previewsContainer    : options.previewsContainer.get(0),
            previewTemplate      : options.previewTemplate,
            maxFiles             : options.maxFiles,
            maxFilesize          : options.maxFilesize,
            acceptedFiles        : acceptedFilesString,
            thumbnailWidth       : options.thumbnailWidth,
            thumbnailHeight      : options.thumbnailHeight,
            error: function (file, message, request) {
                if (file.previewElement) {
                    const $previewElement = $(file.previewElement);
                    let errorText = message;

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
            },
            accept: function(file, done) {
                if (!this._thumbnailQueue.includes(file)) {
                    done();
                    return;
                }

                const errorMessage = this.options.dictInvalidImageDimension;

                file.acceptDimensions = done;
                file.rejectDimensions = function() {
                    done(errorMessage);
                };
            }
        }, options.chunking, options.messages))

        const dropzone = $element.get(0).dropzone;

        this.progressFiles = 0;

        dropzone.on("addedfile", function (file, mock) {
            const $previewElement = $(file.previewElement);
            const removeLabelText = mock ? this.options.dictRemoveFile : this.options.dictCancelUpload;

            $previewElement.find('[data-gwu-remove-label]').text(removeLabelText);
        });

        dropzone.on("removedfile", function (file) {
            if (file.response !== undefined && file.response.id !== undefined) {
                const id = file.response.id;
                const url = options.deleteUrl;

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
            const $previewElement = $(file.previewElement);

            $previewElement.find('[data-gwu-remove-label]').text(this.options.dictRemoveFile);

            self.progressFiles -= 1;
        });

        dropzone.on("thumbnail", function(file) {
            if (file.accepted) {
                return;
            }

            const minWidth = options.width && options.width.min;
            const maxWidth = options.width && options.width.max;
            const minHeight = options.height && options.height.min;
            const maxHeight = options.height && options.height.max;

            if (file.type === 'image/svg+xml' || (
                (!isInteger(minWidth) || file.width >= minWidth)
                && (!isInteger(maxWidth) || file.width <= maxWidth)
                && (!isInteger(minHeight) || file.height >= minHeight)
                && (!isInteger(maxHeight) || file.height <= maxHeight)
            )) {

                file.acceptDimensions();
            } else {
                file.rejectDimensions();
            }
        });

        this.dropzone = dropzone;
    }

    DropzoneUploader.prototype.addFile = function(id, name, size, thumbnailPath) {
        const mockFile = {
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
        return new DropzoneUploader(this, options);
    };

})( jQuery );
