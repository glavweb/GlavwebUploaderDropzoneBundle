/**
 * jQuery object
 * @external jQuery
 * @see {@link http://api.jquery.com/jQuery/}
 */

var visible = 1 << 1
var FieldState = {
    Hidden: 0,
    Visible: visible,
    Editable: visible | 1 << 2
};

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
     * Get media IDs from preview objects
     *
     * @return {Array}
     */
    BaseMediaFormType.prototype.getMediaIdsFromPreviews = function ($previews)
    {
        var self          = this;
        var updatedMedias = [];

        $previews.each(function (key, preview) {
            var data = self.getPreviewData($(preview));
            updatedMedias.push(data['id']);
        });

        return updatedMedias;
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
            editImageSelector       : '.js-control-bar-edit-image'
        }, options);

        // Define UI elements
        this.ui = {
            uploadImageWrapper    : $wrapper.find('.js-upload-image-wrapper'),
            uploadPreviewTemplate : $wrapper.find('.js-upload-preview-template-wrapper').html(),
            uploadPreviewWrapper  : $wrapper.find('.js-upload-preview-wrapper'),
            fieldValue            : $wrapper.find('.js-field-value'),

            controlBar : {
                uploadImage: $wrapper.find('.js-control-bar-upload-image'),
            }
        };
    }

    // Extends from BaseMediaFormType
    BaseImageFormType.prototype = Object.create(BaseMediaFormType.prototype);
    BaseImageFormType.prototype.constructor = BaseImageFormType;

    /**
     * Define preview listeners
     *
     * @param {DOMElement} preview
     */
    BaseImageFormType.prototype.definePreviewListeners = function (preview)
    {
        var self = this;
        var $preview = $(preview);

        // On click edit image
        $preview.find(this.options.editImageSelector).click(function(){
            var splashScreen = self.options.splashScreen;
            if (splashScreen === null || splashScreen === undefined) {
                throw new Error('Splash screen plugin is not defined.');
            }

            var data = self.getPreviewData($preview);
            data['media'] = '<img class="js-image splash-screen-image" src="' + data['content_path'] + '">';

            var editMediaContent     = self.options.editMediaContentFactory.create(data, self.options);
            var $splashScreenContent = editMediaContent.getContent();

            splashScreen.content($splashScreenContent);

            // On save success
            $splashScreenContent.bind('saveSuccess', function(e, response, data) {
                self.setDataForPreview($preview, response.media);
                $preview.find('[data-dz-thumbnail]').attr('src', response.media.thumbnail_path);

                splashScreen.close();
            });
        });
    };

    /**
     * Constructor
     *
     * @param {jQuery} $wrapper
     * @param {object} options
     * @param {function} callback
     */
    function ImageFormType($wrapper, options, callback)
    {
        BaseImageFormType.apply(this, arguments);

        this.options = $.extend({
            file: {},
            thumbnailWidth: 250,
            thumbnailHeight: 250
        }, this.options);

        this.storedFile       = null;
        this.isShowStoredFile = null;

        this.dropzoneUploader = this.initDropzoneUploader(options.uploadUrl, options.deleteUrl, options.file);

        if (callback !== undefined) {
            callback(this);
        }
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
            thumbnailWidth:    this.options.thumbnailWidth,
            thumbnailHeight:   this.options.thumbnailHeight,
            requestId:         this.options.requestId,
            maxFiles:          1,
            chunking:          this.options.chunking,
            maxFilesize:       this.options.maxFilesize,
            width:             this.options.width,
            height:            this.options.height,
            acceptedFiles:     this.options.acceptedFiles,
            messages:          this.options.messages
        });

        if (!$.isEmptyObject(fileItem)) {
            var mockFile = dropzoneUploader.addFile(fileItem.id, fileItem.name, fileItem.size, fileItem.thumbnail_path);

            self.storedFile       = mockFile;
            self.isShowStoredFile = true;
            self.ui.uploadImageWrapper.hide();

            $previewElement = $(mockFile.previewElement);
            self.setDataForPreview($previewElement, fileItem);
            self.definePreviewListeners(mockFile.previewElement);
        }

        var dropzone = dropzoneUploader.dropzone;

        // On maxfilesexceeded
        dropzone.on("maxfilesexceeded", function(file) {
            this.removeAllFiles();
            this.addFile(file);
        });

        // On file added
        dropzone.on("addedfile", function(file) {
            var $previewElement = $(file.previewElement);

            self.definePreviewListeners(file.previewElement);

            if (self.storedFile) {
                $(self.storedFile.previewElement).hide();
                self.isShowStoredFile = false;
            }

            self.ui.uploadImageWrapper.hide();
            $previewElement.find(self.options.editImageSelector).hide();
        });

        // On success
        dropzone.on("success", function(file, response) {
            var $previewElement = $(file.previewElement);

            // Set data for preview
            self.setDataForPreview($previewElement, response);

            $previewElement.find('[data-dz-thumbnail]').attr('src', response.thumbnail_path);
            $previewElement.find(self.options.editImageSelector).show();
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
     * @param {function} callback
     */
    function ImageCollectionFormType($wrapper, options, callback)
    {
        BaseImageFormType.apply(this, arguments);

        this.options = $.extend({
            files: []
        }, this.options);

        this.dropzoneUploader = this.initDropzoneUploader(options.uploadUrl, options.deleteUrl, options.files);

        if (callback !== undefined) {
            callback(this);
        }
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
            chunking:          this.options.chunking,
            maxFilesize:       this.options.maxFilesize,
            width:             this.options.width,
            height:            this.options.height,
            acceptedFiles:     this.options.acceptedFiles,
            messages:          this.options.messages
        });

        $.each(files, function (key, fileItem) {
            var mockFile = dropzoneUploader.addFile(fileItem.id, fileItem.name, fileItem.size, fileItem.thumbnail_path);

            var $previewElement = $(mockFile.previewElement);
            self.setDataForPreview($previewElement, fileItem);
            self.definePreviewListeners(mockFile.previewElement);
        });

        var dropzone = dropzoneUploader.dropzone;

        // On file added
        dropzone.on("addedfile", function(file) {
            var $previewElement = $(file.previewElement);

            self.definePreviewListeners(file.previewElement);

            $previewElement.find(self.options.editImageSelector).hide();
        });

        // On success
        dropzone.on("success", function(file, response) {
            // Set data for preview
            var $previewElement = $(file.previewElement);
            self.setDataForPreview($previewElement, response);
            self.updateMediasInFieldValue();

            $previewElement.find(self.options.editImageSelector).show();
        });

        // On remove file
        dropzone.on("removedfile", function(file, response) {
            self.updateMediasInFieldValue();
        });

        return dropzoneUploader;
    };

    /**
     * Update medias in field value
     *
     * @return void
     */
    ImageCollectionFormType.prototype.updateMediasInFieldValue = function ()
    {
        var self = this;
        var $previews = this.ui.uploadPreviewWrapper.find('.js-dropzone-file');
        var updatedMedias = this.getMediaIdsFromPreviews($previews);

        // update field value
        var fieldValueData = $.parseJSON(this.ui.fieldValue.val());
        fieldValueData.medias = updatedMedias;
        this.ui.fieldValue.val(JSON.stringify(fieldValueData));
    };

    /**
     * Init plugin
     *
     * @param {object} options
     * @param {function} callback
     * @returns {ImageFormType}
     */
    $.fn.imageFormType = function (options, callback)
    {
        return new ImageFormType(this, options, callback);
    };

    /**
     * Init plugin
     *
     * @param {object} options
     * @param {function} callback
     * @returns {ImageCollectionFormType}
     */
    $.fn.imageCollectionFormType = function (options, callback)
    {
        return new ImageCollectionFormType(this, options, callback);
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
            fieldValue     : $wrapper.find('.js-field-value'),
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

            var editMediaContent     = self.options.editMediaContentFactory.create(data, self.options);
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
     * @param {Array} medias
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
     * @param {function} callback
     */
    function VideoFormType($wrapper, options, callback)
    {
        BaseVideoFormType.apply(this, arguments);

        this.options = $.extend({
            media : {}
        }, this.options);

        this.addMedia(this.options.media, true);

        if (callback !== undefined) {
            callback(this);
        }
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
     * @param {function} callback
     */
    function VideoCollectionFormType($wrapper, options, callback)
    {
        BaseVideoFormType.apply(this, arguments);

        this.options = $.extend({
            medias : []
        }, this.options);

        this.addMedias(this.options.medias);

        if (callback !== undefined) {
            callback(this);
        }
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
        this.updateMediasInFieldValue();
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
        this.updateMediasInFieldValue();
    };

    /**
     * Update medias in field value
     *
     * @return void
     */
    VideoCollectionFormType.prototype.updateMediasInFieldValue = function ()
    {
        var self = this;
        var $previews = this.ui.previewWrapper.find('.js-preview');
        var updatedMedias = this.getMediaIdsFromPreviews($previews);

        // update field value
        var fieldValueData = $.parseJSON(this.ui.fieldValue.val());
        fieldValueData.medias = updatedMedias;
        this.ui.fieldValue.val(JSON.stringify(fieldValueData));
    };

    /**
     * Init plugin
     *
     * @param {object} options
     * @param {function} callback
     * @returns {VideoFormType}
     */
    $.fn.videoFormType = function (options, callback)
    {
        return new VideoFormType(this, options, callback);
    };

    /**
     * Init plugin
     *
     * @param {object} options
     * @param {function} callback
     * @returns {VideoFormType}
     */
    $.fn.videoCollectionFormType = function (options, callback)
    {
        return new VideoCollectionFormType(this, options, callback);
    };

    /**
     * Constructor
     *
     * @param {jQuery} $wrapper
     * @param {object} options
     */
    function BaseFileFormType($wrapper, options)
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
                dictInvalidFileType:  "You can't upload files of this type.",
                serverError:          "An error occurred on the server."
            },
            editFileSelector:   '.js-control-bar-edit-file'
        }, options);

        // Define UI elements
        this.ui = {
            uploadFileWrapper     : $wrapper.find('.js-upload-file-wrapper'), // Area has upload button
            uploadPreviewTemplate : $wrapper.find('.js-preview-template-wrapper').html(), // Preview template
            uploadPreviewWrapper  : $wrapper.find('.js-preview-wrapper'), // Where display previews
            fieldValue            : $wrapper.find('.js-field-value'), // hidden input

            controlBar : {
                uploadFile: $wrapper.find('.js-control-bar-upload-file') // Upload zone
            }
        };
    }

    // Extends from BaseMediaFormType
    BaseFileFormType.prototype = Object.create(BaseMediaFormType.prototype);
    BaseFileFormType.prototype.constructor = BaseFileFormType;

    /**
     * Define preview listeners
     *
     * @param {DOMElement} preview
     */
    BaseFileFormType.prototype.definePreviewListeners = function (preview)
    {
        var self = this;
        var $preview = $(preview);

        // On click edit file
        $preview.find(this.options.editFileSelector).click(function(){
            var splashScreen = self.options.splashScreen;
            if (splashScreen === null || splashScreen === undefined) {
                throw new Error('Splash screen plugin is not defined.');
            }

            var data = self.getPreviewData($preview);
            data['media'] = '<img class="js-file splash-screen-file" src="' + data['content_path'] + '">';

            var editMediaContent     = self.options.editMediaContentFactory.create(data, self.options);
            var $splashScreenContent = editMediaContent.getContent();

            splashScreen.content($splashScreenContent);

            // On save success
            $splashScreenContent.bind('saveSuccess', function(e, response, data) {
                self.setPreviewName($preview, data.name);
                self.setDataForPreview($preview, data);
            });
        });
    };

    /**
     * Set name
     *
     * @param {jQuery} $previewElement
     * @param {string} name
     */
    BaseFileFormType.prototype.setPreviewName = function ($previewElement, name)
    {
        $previewElement.find('.js-file-name').text(name);
    };

    /**
     * Constructor
     *
     * @param {jQuery} $wrapper
     * @param {object} options
     * @param {function} callback
     */
    function FileFormType($wrapper, options, callback)
    {
        BaseFileFormType.apply(this, arguments);

        this.options = $.extend({
            file: {}
        }, this.options);

        this.storedFile       = null;
        this.isShowStoredFile = null;

        this.dropzoneUploader = this.initDropzoneUploader(options.uploadUrl, options.deleteUrl, options.file);

        if (callback !== undefined) {
            callback(this);
        }
    }

    // Extends from BaseFileFormType
    FileFormType.prototype = Object.create(BaseFileFormType.prototype);
    FileFormType.prototype.constructor = FileFormType;

    /**
     * Init dropzone uploader
     *
     * @param {string} uploadUrl
     * @param {string} deleteUrl
     * @param {object} fileItem
     */
    FileFormType.prototype.initDropzoneUploader = function (uploadUrl, deleteUrl, fileItem)
    {
        var self = this;
        var dropzoneUploader = $(this.ui.controlBar.uploadFile).dropzoneUploader({
            url:                uploadUrl,
            deleteUrl:          deleteUrl,
            previewsContainer:  this.ui.uploadPreviewWrapper.selector,
            previewTemplate:    this.ui.uploadPreviewTemplate,
            requestId:          this.options.requestId,
            maxFiles:           1,
            chunking:           this.options.chunking,
            maxFilesize:        this.options.maxFilesize,
            width:             this.options.width,
            height:            this.options.height,
            acceptedFiles:      this.options.acceptedFiles,
            messages:           this.options.messages
        });

        if (!$.isEmptyObject(fileItem)) {
            var mockFile = dropzoneUploader.addFile(fileItem.id, fileItem.name, fileItem.size, fileItem.thumbnail_path);

            self.storedFile       = mockFile;
            self.isShowStoredFile = true;
            self.ui.uploadFileWrapper.hide();

            $previewElement = $(mockFile.previewElement);
            $previewElement.show();

            self.setPreviewName($previewElement, fileItem.name);
            self.setDataForPreview($previewElement, fileItem);
            self.definePreviewListeners(mockFile.previewElement)
        }

        var dropzone = dropzoneUploader.dropzone;

        // On maxfilesexceeded
        dropzone.on("maxfilesexceeded", function(file) {
            this.removeAllFiles();
            this.addFile(file);
        });

        // On file added
        dropzone.on("addedfile", function(file) {
            var $previewElement = $(file.previewElement);

            self.definePreviewListeners(file.previewElement)

            if (self.storedFile) {
                $(self.storedFile.previewElement).hide();
                self.isShowStoredFile = false;
            }

            // Set name for preview
            self.setPreviewName($previewElement, file.name);

            self.ui.uploadFileWrapper.hide();
            $previewElement.find(self.options.editFileSelector).hide();
        });

        // On success
        dropzone.on("success", function(file, response) {
            var $previewElement = $(file.previewElement);

            // Set data for preview
            self.setDataForPreview($previewElement, response);

            $previewElement.find(self.options.editFileSelector).show();
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
                self.ui.uploadFileWrapper.show();
            }
        });

        return dropzoneUploader;
    };

    /**
     * Init plugin
     *
     * @param {object} options
     * @param {function} callback
     * @returns {FileFormType}
     */
    $.fn.fileFormType = function (options, callback)
    {
        return new FileFormType(this, options, callback);
    };
})(jQuery);

(function ($, FieldState) {
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
     * @param {object} fieldOptions
     */
    EditMediaContentFactory.prototype.create = function (data, fieldOptions) {
        return new EditMediaContent(this.template, this.options, data, fieldOptions);
    };

    /**
     * @param {string} template
     * @param {object} options
     * @param {object} data
     * @param {object} fieldOptions
     * @constructor
     */
    function EditMediaContent(template, options, data, fieldOptions) {
        this.options = $.extend({
            editUrl   : null,
            requestId : null,
            cropper: {
                ratio: 1
            },
            messages : {
                saveButtonLoadingText: 'Saving...'
            }
        }, options);

        this.fieldOptions = fieldOptions;

        $template = $(template);
        this.template = $template;

        this.data = data;
        this.cropper = null;

        this.ui = {
            media : $template.find('[data-media]'),
            form: {
                name             : $template.find('[data-form-name-input]'),
                nameGroup        : $template.find('[data-form-name-group]'),
                nameText         : $template.find('[data-form-name-text]'),
                description      : $template.find('[data-form-description-input]'),
                descriptionGroup : $template.find('[data-form-description-group]'),
                descriptionText  : $template.find('[data-form-description-text]')
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

        this.saveButtonText = this.ui.controlBar.saveButton.text();

        this.configure();
        this.defineListeners();
        this.populate(data);

        if (data.content_type !== 'image/svg+xml') {
            this.initCropper(this.options.cropper);
        }
    }

    EditMediaContent.prototype.configure = function () {
        switch (this.fieldOptions.nameFieldState) {
            case FieldState.Hidden:
                this.ui.form.nameGroup.hide();
                break;
            case FieldState.Visible:
                this.ui.form.name.hide();
                break;
            default:
                this.ui.form.nameText.hide();
        }

        switch (this.fieldOptions.descriptionFieldState) {
            case FieldState.Hidden:
                this.ui.form.descriptionGroup.hide();
                break;
            case FieldState.Visible:
                this.ui.form.description.hide();
                break;
            default:
                this.ui.form.descriptionText.hide();
        }
    }

    /**
     * Define listeners
     */
    EditMediaContent.prototype.initCropper = function (options) {
        $cropImage = this.ui.media.find('img');
        var image = $cropImage.get(0);

        if (image) {
            this.cropper = new Cropper(image, {
                aspectRatio: options.ratio,
                initialAspectRatio: options.ratio,
                viewMode: 1,
                autoCropArea: 1,
                movable: false,
                scalable: false,
                zoomable: false
            });
        }
    };

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

        if (this.cropper) {
            data.crop_data = JSON.stringify(this.cropper.getData());
        }

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
        this.template.trigger('beforeSave', [response, data]);
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
        this.ui.form.nameText.text(data['name']);
        this.ui.form.description.val(data['description']);
        this.ui.form.descriptionText.text(data['description']);
        this.ui.table.contentType.text(data['content_type']);
        this.ui.table.contentSize.text(contentSize);
        this.ui.table.width.text(data['width'] !== null ? data['width'] : '-');
        this.ui.table.height.text(data['height'] !== null ? data['height'] : '-');
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
})(jQuery, FieldState);
