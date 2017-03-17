/**
 * jQuery object
 * @external jQuery
 * @see {@link http://api.jquery.com/jQuery/}
 */

/**
 * MediaFormType
 *
 * @author Andrey Nilov <nilov@glavweb.ru>
 */
(function ($) {
    /**
     * Constructor
     */
    function BaseMediaFormType()
    {}

    /**
     * Set data for preview
     *
     * @param {jQuery} $previewElement
     * @param {object} fileItem
     */
    BaseMediaFormType.prototype.setDataForPreview = function ($previewElement, fileItem)
    {
        $previewElement.data('id', fileItem.id);
        $previewElement.data('name', fileItem.name);
        $previewElement.data('description', fileItem.description);
        $previewElement.data('thumbnail_path', fileItem.thumbnail_path);
        $previewElement.data('content_path', fileItem.content_path);
        $previewElement.data('content_type', fileItem.content_type);
        $previewElement.data('content_size', fileItem.content_size);
        $previewElement.data('width', fileItem.width);
        $previewElement.data('height', fileItem.height);
        $previewElement.data('provider_reference', fileItem.provider_reference);
    };

    /**
     * Get data for preview
     *
     * @param {jQuery} $previewElement
     * @return {object}
     */
    BaseMediaFormType.prototype.getPreviewData = function ($previewElement)
    {
        return {
            id                 : $previewElement.data('id'),
            name               : $previewElement.data('name'),
            description        : $previewElement.data('description'),
            thumbnail_path     : $previewElement.data('thumbnail_path'),
            content_path       : $previewElement.data('content_path'),
            content_type       : $previewElement.data('content_type'),
            content_size       : $previewElement.data('content_size'),
            width              : $previewElement.data('width'),
            height             : $previewElement.data('height'),
            provider_reference : $previewElement.data('provider_reference')
        };
    };

    /**
     * Constructor
     *
     * @param {jQuery} $wrapper
     * @param {object} options
     */
    function BaseImageFormType($wrapper, options)
    {
        this.wrapper = $wrapper;
        this.options = $.extend({
            uploadUrl               : null,
            deleteUrl               : null,
            requestId               : null,
            splashScreen            : null,
            editMediaContentFactory : null,
            messages: {
                dictMaxFilesExceeded: "You can't download files more than",
                serverError:          'An error occurred on the server.'
            }
        }, options);

        // Define UI elements
        this.ui = {
            uploadImageWrapper    : $wrapper.find('.js-upload-image-wrapper'),
            uploadPreviewTemplate : $wrapper.find('.js-upload-preview-template-wrapper').html(),
            uploadPreviewWrapper  : $wrapper.find('.js-upload-preview-wrapper'),
            fieldValue            : $wrapper.find('.js-field-value'),

            controlBar : {
                uploadImage: $wrapper.find('.js-control-bar-upload-image'),
                editImage:   $wrapper.find('.js-control-bar-edit-image')
            }
        };

        // Define listeners
        this.defineListeners();
    }

    // Extends from BaseMediaFormType
    BaseImageFormType.prototype = Object.create(BaseMediaFormType.prototype);
    BaseImageFormType.prototype.constructor = BaseImageFormType;

    /**
     * Define listeners
     */
    BaseImageFormType.prototype.defineListeners = function ()
    {
        var self = this;

        // On click edit image
        $(document).on('click', this.ui.controlBar.editImage.selector, function(){
            var $preview = $(this).closest('.js-dropzone-file');

            splashScreen = self.options.splashScreen;
            if (splashScreen === null || splashScreen === undefined) {
                throw new Error('Splash screen plugin is not defined.');
            }

            var data = self.getPreviewData($preview);
            data['media'] = '<img class="js-image splash-screen-image" src="' + data['content_path'] + '">';

            var editMediaContent     = self.options.editMediaContentFactory.create(data);
            var $splashScreenContent = editMediaContent.getContent();

            splashScreen.content($splashScreenContent);

            // On save success
            $splashScreenContent.bind('saveSuccess', function(e, response, data) {
                self.setDataForPreview($preview, data);
            });
        });
    };

    /**
     * Constructor
     *
     * @param {jQuery} $wrapper
     * @param {object} options
     */
    function ImageFormType($wrapper, options)
    {
        BaseImageFormType.apply(this, arguments);

        this.options = $.extend({
            file: {}
        }, this.options);

        this.storedFile       = null;
        this.isShowStoredFile = null;

        this.dropzoneUploader = this.initDropzoneUploader(options.uploadUrl, options.deleteUrl, options.file);
    }

    // Extends from BaseImageFormType
    ImageFormType.prototype = Object.create(BaseImageFormType.prototype);
    ImageFormType.prototype.constructor = ImageFormType;

    /**
     * Init dropzone uploader
     *
     * @param {string} uploadUrl
     * @param {string} deleteUrl
     * @param {object} fileItem
     */
    ImageFormType.prototype.initDropzoneUploader = function (uploadUrl, deleteUrl, fileItem)
    {
        var self = this;
        var dropzoneUploader = $(this.ui.controlBar.uploadImage).dropzoneUploader({
            url:               uploadUrl,
            deleteUrl:         deleteUrl,
            previewsContainer: this.ui.uploadPreviewWrapper.selector,
            previewTemplate:   this.ui.uploadPreviewTemplate,
            requestId:         this.options.requestId,
            maxFiles:          1,
            messages: {
                dictMaxFilesExceeded: this.options.dictMaxFilesExceeded,
                serverError:          this.options.serverError
            }
        });

        if (!$.isEmptyObject(fileItem)) {
            var mockFile = dropzoneUploader.addFile(fileItem.id, fileItem.name, fileItem.size, fileItem.thumbnail_path);

            self.storedFile       = mockFile;
            self.isShowStoredFile = true;
            self.ui.uploadImageWrapper.hide();

            $previewElement = $(mockFile.previewElement);
            self.setDataForPreview($previewElement, fileItem);
        }

        var dropzone = dropzoneUploader.dropzone;

        // On maxfilesexceeded
        dropzone.on("maxfilesexceeded", function(file) {
            this.removeAllFiles();
            this.addFile(file);
        });

        // On thumbnail
        dropzone.on("thumbnail", function(file, response) {
            if (self.storedFile) {
                $(self.storedFile.previewElement).hide();
                self.isShowStoredFile = false;
            }

            self.ui.uploadImageWrapper.hide();
        });

        // On success
        dropzone.on("success", function(file, response) {
            // Set data for preview
            $previewElement = $(file.previewElement);
            self.setDataForPreview($previewElement, response);
        });

        // On remove file
        dropzone.on("removedfile", function(file, response) {
            if (self.isShowStoredFile) {
                self.storedFile       = null;
                self.isShowStoredFile = false;

            } else {
                self.isShowStoredFile = true;
            }

            if (self.storedFile) {
                $(self.storedFile.previewElement).show();

            } else {
                self.ui.uploadImageWrapper.show();
            }
        });

        return dropzoneUploader;
    };

    /**
     * Constructor
     *
     * @param {jQuery} $wrapper
     * @param {object} options
     */
    function ImageCollectionFormType($wrapper, options)
    {
        BaseImageFormType.apply(this, arguments);

        this.options = $.extend({
            files: []
        }, this.options);

        this.dropzoneUploader = this.initDropzoneUploader(options.uploadUrl, options.deleteUrl, options.files);
    }

    // Extends BaseImageFormType
    ImageCollectionFormType.prototype = Object.create(BaseImageFormType.prototype);
    ImageCollectionFormType.prototype.constructor = ImageCollectionFormType;

    /**
     * Init dropzone uploader
     *
     * @param {string} uploadUrl
     * @param {string} deleteUrl
     * @param {Array}  files
     */
    ImageCollectionFormType.prototype.initDropzoneUploader = function (uploadUrl, deleteUrl, files)
    {
        var self = this;
        var dropzoneUploader = $(this.ui.controlBar.uploadImage).dropzoneUploader({
            url:               uploadUrl,
            deleteUrl:         deleteUrl,
            previewsContainer: this.ui.uploadPreviewWrapper.selector,
            previewTemplate:   this.ui.uploadPreviewTemplate,
            requestId:         this.options.requestId,
            messages: {
                dictMaxFilesExceeded: this.options.dictMaxFilesExceeded,
                serverError:          this.options.serverError
            }
        });

        $.each(files, function (key, fileItem) {
            var mockFile = dropzoneUploader.addFile(fileItem.id, fileItem.name, fileItem.size, fileItem.thumbnail_path);

            $previewElement = $(mockFile.previewElement);
            self.setDataForPreview($previewElement, fileItem);
        });

        var dropzone = dropzoneUploader.dropzone;

        // On success
        dropzone.on("success", function(file, response) {
            // Set data for preview
            $previewElement = $(file.previewElement);
            self.setDataForPreview($previewElement, response);
        });

        return dropzoneUploader;
    };

    /**
     * Init plugin
     *
     * @param {object} options
     * @returns {ImageFormType}
     */
    $.fn.imageFormType = function (options)
    {
        return new ImageFormType(this, options);
    };

    /**
     * Init plugin
     *
     * @param {object} options
     * @returns {ImageCollectionFormType}
     */
    $.fn.imageCollectionFormType = function (options)
    {
        return new ImageCollectionFormType(this, options);
    };

    /**
     * Constructor
     *
     * @param {jQuery} $wrapper
     * @param {object} options
     */
    function BaseVideoFormType($wrapper, options)
    {
        this.wrapper = $wrapper;
        this.options = $.extend({
            uploadUrl       : null,
            deleteUrl       : null,
            requestId       : null,
            previewTemplate : null,
            media           : {},
            messages: {
                uploadVideoLoadingText: 'Uploading...'
            }
        }, options);

        // Define UI elements
        this.ui = {
            previewWrapper : $wrapper.find('.js-preview-wrapper'),
            uploadInput    : $wrapper.find('.js-upload-input'),
            controlBar : {
                uploadVideo  : $wrapper.find('.js-control-bar-upload-video'),
                editButton   : $wrapper.find('.js-control-bar-edit'),
                removeButton : $wrapper.find('.js-control-bar-delete')
            }
        };

        this.uploadVideoText = this.ui.controlBar.uploadVideo.text();

        this.addedMedias = [];
        this.storedMedia = null;

        // Define listeners
        this.defineListeners();
    }

    // Extends from BaseMediaFormType
    BaseVideoFormType.prototype = Object.create(BaseMediaFormType.prototype);
    BaseVideoFormType.prototype.constructor = BaseVideoFormType;

    /**
     * Define listeners
     */
    BaseVideoFormType.prototype.defineListeners = function ()
    {
        var self = this;

        // On upload
        this.ui.controlBar.uploadVideo.on('click', function () {
            var link = self.ui.uploadInput.val();
            self.uploadVideo(link);

            return false;
        });

        // On edit
        $(document).on('click', this.ui.controlBar.editButton.selector, function(){
            var $preview = $(this).closest('.js-preview');

            splashScreen = self.options.splashScreen;
            if (splashScreen === null || splashScreen === undefined) {
                throw new Error('Splash screen plugin is not defined.');
            }

            var data = self.getPreviewData($preview);

            var src = '//www.youtube.com/embed/' + data.provider_reference;
            data['media'] = '<iframe class="js-iframe" width="' + data.width + '" height="' + data.height + '" src="' + src + '" frameborder="0" allowfullscreen></iframe>';

            var editMediaContent     = self.options.editMediaContentFactory.create(data);
            var $splashScreenContent = editMediaContent.getContent();

            splashScreen.content($splashScreenContent);

            // On save success
            $splashScreenContent.bind('saveSuccess', function(e, response, data) {
                self.setDataForPreview($preview, data);
            });

            return false;
        });

        // On delete
        $(document).on('click', this.ui.controlBar.removeButton.selector, function(){
            var preview = $(this).closest('.js-preview');
            var videoId = preview.data('id');

            self.deleteVideo(videoId, preview);

            return false;
        });
    };

    /**
     * Add medias
     *
     * @param {array} medias
     */
    BaseVideoFormType.prototype.addMedias = function (medias)
    {
        var self = this;

        $.each(medias, function (key, media) {
            self.addMedia(media);
        });
    };

    /**
     * Add media
     *
     * @param {object} media
     * @param {bool}   storeMedia
     */
    BaseVideoFormType.prototype.addMedia = function (media, storeMedia)
    {
        if ($.isEmptyObject(media)) {
            return;
        }

        storeMedia = storeMedia !== undefined ? storeMedia : false;

        var preview = $(this.options.previewTemplate);
        preview.find('.js-preview-image').attr('src', media['thumbnail_path']);

        this.setDataForPreview(preview, media);

        this.ui.previewWrapper.append(preview);

        if (storeMedia) {
            this.storedMedia = preview;

        } else {
            this.addedMedias.push(preview);
        }
    };

    /**
     * Upload video
     */
    BaseVideoFormType.prototype.removeAddedMedias = function ()
    {
        $.each(this.addedMedias, function () {
            this.remove();
        });
    };

    /**
     * Upload video
     *
     * @param {string} link
     */
    BaseVideoFormType.prototype.uploadVideo = function (link)
    {
        var self = this;
        var uploadUrl = this.options.uploadUrl;

        $.ajax({
            url: uploadUrl,
            method: 'POST',
            data: {
                file_link  : link,
                request_id : this.options.requestId
            },
            dataType: 'json',
            beforeSend: function(response) {
                self.onUploadBeforeSend(response);
            },
            success: function (response) {
                self.onUploadSuccess(response);
            },
            error: function (response) {
                self.onUploadError(response);
            }
        });
    };

    /**
     * Delete video
     *
     * @param {int}    id
     * @param {jQuery} preview
     */
    BaseVideoFormType.prototype.deleteVideo = function (id, preview)
    {
        if (!id) {
            this.onDeleteError({}, preview);

            return;
        }

        var self      = this;
        var deleteUrl = this.options.deleteUrl;

        $.ajax({
            url: deleteUrl,
            method: 'POST',
            data: {
                id         : id,
                request_id : this.options.requestId
            },
            dataType: 'json',
            beforeSend: function(response) {
                self.onDeleteBeforeSend(response, preview);
            },
            success: function (response) {
                self.onDeleteSuccess(response, preview);
            },
            error: function (response) {
                self.onDeleteError(response, preview);
            }
        });
    };

    /**
     * On upload before send
     *
     * @param {object} response
     */
    BaseVideoFormType.prototype.onUploadBeforeSend = function (response)
    {
        this.uploadButtonDisabled();
    };

    /**
     * On upload success
     *
     * @param {object} response
     */
    BaseVideoFormType.prototype.onUploadSuccess = function (response)
    {};

    /**
     * On upload error
     *
     * @param {object} response
     */
    BaseVideoFormType.prototype.onUploadError = function (response)
    {
        self.uploadButtonEnabled();

        alert('Upload video failed.');
    };

    /**
     * On delete before send
     *
     * @param {object} response
     * @param {jQuery} preview
     */
    BaseVideoFormType.prototype.onDeleteBeforeSend = function (response, preview)
    {};

    /**
     * On delete success
     *
     * @param {object} response
     * @param {jQuery} preview
     */
    BaseVideoFormType.prototype.onDeleteSuccess = function (response, preview)
    {};

    /**
     * On delete error
     *
     * @param {object} response
     * @param {jQuery} preview
     */
    BaseVideoFormType.prototype.onDeleteError = function (response, preview)
    {
        alert('To remove the video failed.');
    };

    /**
     * Upload button disabled
     */
    BaseVideoFormType.prototype.uploadButtonDisabled = function ()
    {
        this.ui.controlBar.uploadVideo.attr('disabled', true);
        this.ui.controlBar.uploadVideo.text(this.options.messages.uploadVideoLoadingText);
    };

    /**
     * Upload button enabled
     */
    BaseVideoFormType.prototype.uploadButtonEnabled = function ()
    {
        this.ui.controlBar.uploadVideo.attr('disabled', false);
        this.ui.controlBar.uploadVideo.text(this.uploadVideoText);
    };

    /**
     * Upload button enabled
     */
    BaseVideoFormType.prototype.clearUploadLink = function ()
    {
        this.ui.uploadInput.val('');
    };

    /**
     * VideoFormType constructor
     *
     * @param {jQuery} $wrapper
     * @param {object} options
     */
    function VideoFormType($wrapper, options)
    {
        BaseVideoFormType.apply(this, arguments);

        this.options = $.extend({
            media : {}
        }, this.options);

        this.addMedia(this.options.media, true);
    }

    // Extends from BaseImageFormType
    VideoFormType.prototype = Object.create(BaseVideoFormType.prototype);
    VideoFormType.prototype.constructor = VideoFormType;

    /**
     * On upload success
     *
     * @param {object} response
     */
    VideoFormType.prototype.onUploadSuccess = function (response)
    {
        this.uploadButtonEnabled();
        this.clearUploadLink();
        this.removeAddedMedias();

        this.addMedia(response);

        if (this.storedMedia) {
            this.storedMedia.hide();
        }
    };

    /**
     * On delete success
     *
     * @param {object} response
     * @param {jQuery} preview
     */
    VideoFormType.prototype.onDeleteSuccess = function (response, preview)
    {
        preview.remove();

        if (this.storedMedia) {
            this.storedMedia.show();
        }
    };

    /**
     * VideoCollectionFormType constructor
     *
     * @param {jQuery} $wrapper
     * @param {object} options
     */
    function VideoCollectionFormType($wrapper, options)
    {
        BaseVideoFormType.apply(this, arguments);

        this.options = $.extend({
            medias : []
        }, this.options);

        this.addMedias(this.options.medias);
    }

    // Extends from BaseImageFormType
    VideoCollectionFormType.prototype = Object.create(BaseVideoFormType.prototype);
    VideoCollectionFormType.prototype.constructor = VideoCollectionFormType;


    /**
     * On upload success
     *
     * @param {object} response
     */
    VideoCollectionFormType.prototype.onUploadSuccess = function (response)
    {
        this.uploadButtonEnabled();
        this.clearUploadLink();

        this.addMedia(response);
    };

    /**
     * On delete success
     *
     * @param {object} response
     * @param {jQuery} preview
     */
    VideoCollectionFormType.prototype.onDeleteSuccess = function (response, preview)
    {
        preview.remove();
    };

    /**
     * Init plugin
     *
     * @param {object} options
     * @returns {VideoFormType}
     */
    $.fn.videoFormType = function (options)
    {
        return new VideoFormType(this, options);
    };

    /**
     * Init plugin
     *
     * @param {object} options
     * @returns {VideoFormType}
     */
    $.fn.videoCollectionFormType = function (options)
    {
        return new VideoCollectionFormType(this, options);
    };
})(jQuery);

(function ($) {
    /**
     * @param {HTMLElement} $wrapper
     * @param {object}     options
     * @constructor
     */
    function EditMediaContentFactory($wrapper, options) {
        this.options  = options;
        this.template = $wrapper.html();
    }

    /**
     * Create content
     *
     * @param {object} data
     */
    EditMediaContentFactory.prototype.create = function (data) {
        return new EditMediaContent(this.template, this.options, data);
    };

    /**
     * @param {string} template
     * @param {object} options
     * @param {object} data
     * @constructor
     */
    function EditMediaContent(template, options, data) {
        this.options = $.extend({
            editUrl   : null,
            requestId : null,
            messages : {
                saveButtonLoadingText: 'Saving...'
            }
        }, options);

        $template = $(template);
        this.template = $template;

        this.data = data;

        this.ui = {
            media : $template.find('[data-media]'),
            form: {
                name        : $template.find('[data-form-name]'),
                description : $template.find('[data-form-description]')
            },
            table: {
                contentType : $template.find('[data-table-content-type]'),
                contentSize : $template.find('[data-table-content-size]'),
                width       : $template.find('[data-table-width]'),
                height      : $template.find('[data-table-height]')
            },
            controlBar : {
                saveButton : $template.find('[data-save-button]')
            }
        };

        this.saveButtonText        = this.ui.controlBar.saveButton.text();

        this.defineListeners();
        this.populate(data);
    }

    /**
     * Define listeners
     */
    EditMediaContent.prototype.defineListeners = function () {
        var self = this;

        this.ui.controlBar.saveButton.on('click', function () {
            var id = self.data.id;

            self.saveChanges(id);
        });
    };

    /**
     * Save
     */
    EditMediaContent.prototype.saveChanges = function (id) {
        var self = this;

        if (!this.options.editUrl) {
            throw new Error('Save URL is not defined.');
        }

        if (!this.options.requestId) {
            throw new Error('Request ID is not defined.');
        }

        var name        = this.ui.form.name.val();
        var description = this.ui.form.description.val();

        var data = {
            id          : id,
            request_id  : this.options.requestId,
            name        : name,
            description : description
        };

        $.ajax({
            url: this.options.editUrl,
            method: 'POST',
            data: data,
            dataType: 'json',
            beforeSend: function(response) {
                self.onSaveBeforeSend(response, data);
            },
            success: function (response) {
                self.onSaveSuccess(response, data);
            },
            error: function (response) {
                self.onSaveError(response, data);
            }
        });
    };

    /**
     * On save before send
     *
     * @param {object} response
     * @param {object} data
     */
    EditMediaContent.prototype.onSaveBeforeSend = function (response, data)
    {
        this.saveButtonDisabled();
    };

    /**
     * On save success
     *
     * @param {object} response
     * @param {object} data
     */
    EditMediaContent.prototype.onSaveSuccess = function (response, data)
    {
        this.saveButtonEnabled();

        this.template.trigger('saveSuccess', [response, data]);
    };

    /**
     * On save error
     *
     * @param {object} response
     */
    EditMediaContent.prototype.onSaveError = function (response)
    {
        alert('Save failed.');

        this.saveButtonEnabled();
    };

    /**
     * Populate
     *
     * @param {object} data
     */
    EditMediaContent.prototype.populate = function (data) {
        var contentSize = this.humanFileSize(data['content_size']);

        this.ui.media.html(data['media']);
        this.ui.form.name.val(data['name']);
        this.ui.form.description.val(data['description']);
        this.ui.table.contentType.text(data['content_type']);
        this.ui.table.contentSize.text(contentSize);
        this.ui.table.width.text(data['width']);
        this.ui.table.height.text(data['height']);
    };

    /**
     * Get content
     *
     * @return {HTMLElement}
     */
    EditMediaContent.prototype.getContent = function () {
        return this.template;
    };

    /**
     * Save button disabled
     */
    EditMediaContent.prototype.saveButtonDisabled = function ()
    {
        this.ui.controlBar.saveButton.attr('disabled', true);
        this.ui.controlBar.saveButton.text(this.options.messages.saveButtonLoadingText);
    };

    /**
     * Save button enabled
     */
    EditMediaContent.prototype.saveButtonEnabled = function ()
    {
        this.ui.controlBar.saveButton.attr('disabled', false);
        this.ui.controlBar.saveButton.text(this.saveButtonText);
    };

    /**
     * @param {int}     bytes
     * @param {boolean} si
     * @return {string}
     */
    EditMediaContent.prototype.humanFileSize = function (bytes, si)
    {
        si = si === undefined ? true : si;

        if (!bytes > 0) {
            return '';
        }

        var thresh = si ? 1000 : 1024;
        if (Math.abs(bytes) < thresh) {
            return bytes + ' B';
        }

        var units = si
            ? ['kB','MB','GB','TB','PB','EB','ZB','YB']
            : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
        var u = -1;

        do {
            bytes /= thresh;
            ++u;
        } while (Math.abs(bytes) >= thresh && u < units.length - 1);

        return bytes.toFixed(1) + ' ' + units[u];
    };

    /**
     * Init plugin
     *
     * @param {object} options
     */
    $.fn.editMediaContentFactory = function (options) {
        return new EditMediaContentFactory(this, options);
    };
})(jQuery);
