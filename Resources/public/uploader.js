/**
 * Media widgets: upload, crop, reorder. No third-party libraries.
 *
 * @author Andrey Nilov <nilov@glavweb.ru>
 */
(function () {
    'use strict';

    const MEDIA_FIELDS = [
        'id',
        'name',
        'description',
        'thumbnail_path',
        'content_path',
        'content_type',
        'content_size',
        'width',
        'height',
        'provider_reference'
    ];

    function attributeName(field) {
        return 'data-' + field.replace(/_/g, '-');
    }

    function setPreviewData(preview, media) {
        MEDIA_FIELDS.forEach(function (field) {
            const value = media[field];
            if (value === undefined || value === null) {
                preview.removeAttribute(attributeName(field));
                return;
            }

            preview.setAttribute(attributeName(field), String(value));
        });
    }

    function getPreviewData(preview) {
        const data = {};

        MEDIA_FIELDS.forEach(function (field) {
            const value = preview.getAttribute(attributeName(field));
            data[field] = value === null ? null : value;
        });

        return data;
    }

    function setHidden(element, hidden) {
        if (!element) {
            return;
        }

        element.classList.toggle('gwu-is-hidden', hidden);
    }

    function formatMessage(template, vars) {
        return String(template || '').replace(/\{\{(\w+)\}\}/g, function (_, key) {
            return Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : '';
        });
    }

    function isInteger(value) {
        return typeof value === 'number' && value % 1 === 0;
    }

    function acceptedList(value) {
        if (!value) {
            return [];
        }

        if (Array.isArray(value)) {
            return value.map(function (item) {
                return String(item).trim().toLowerCase();
            }).filter(Boolean);
        }

        if (typeof value === 'string') {
            return value.split(',').map(function (item) {
                return item.trim().toLowerCase();
            }).filter(Boolean);
        }

        return [];
    }

    function isAccepted(file, accepted) {
        if (!accepted.length) {
            return true;
        }

        const name = String(file.name || '').toLowerCase();
        const type = String(file.type || '').toLowerCase();

        return accepted.some(function (rule) {
            if (rule.charAt(0) === '.') {
                return name.endsWith(rule);
            }

            if (rule.slice(-2) === '/*') {
                return type.indexOf(rule.slice(0, -1)) === 0;
            }

            return type === rule;
        });
    }

    function humanFileSize(bytes) {
        if (!bytes || bytes <= 0) {
            return '';
        }

        const thresh = 1000;
        if (Math.abs(bytes) < thresh) {
            return bytes + ' B';
        }

        const units = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        let unit = -1;
        let size = bytes;

        do {
            size /= thresh;
            unit += 1;
        } while (Math.abs(size) >= thresh && unit < units.length - 1);

        return size.toFixed(1) + ' ' + units[unit];
    }

    function createUuid() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return window.crypto.randomUUID();
        }

        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (char) {
            const random = Math.random() * 16 | 0;
            const value = char === 'x' ? random : (random & 0x3 | 0x8);

            return value.toString(16);
        });
    }

    function postForm(url, body) {
        return fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            },
            body: body.toString()
        }).then(function (response) {
            return response.json().catch(function () {
                return {};
            }).then(function (payload) {
                return { ok: response.ok, status: response.status, payload: payload };
            });
        });
    }

    function sendFormData(url, formData, onProgress, signal) {
        return new Promise(function (resolve, reject) {
            const xhr = new XMLHttpRequest();

            xhr.open('POST', url);
            xhr.setRequestHeader('Accept', 'application/json');
            xhr.upload.onprogress = function (event) {
                if (event.lengthComputable && onProgress) {
                    onProgress(event.loaded, event.total);
                }
            };
            xhr.onload = function () {
                let payload = null;
                try {
                    payload = JSON.parse(xhr.responseText);
                } catch (error) {
                    payload = null;
                }

                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(payload);
                    return;
                }

                const failure = new Error('upload failed');
                failure.status = xhr.status;
                failure.payload = payload;
                reject(failure);
            };
            xhr.onerror = function () {
                reject(new Error('network'));
            };
            xhr.onabort = function () {
                const failure = new Error('abort');
                failure.aborted = true;
                reject(failure);
            };

            if (signal) {
                if (signal.aborted) {
                    xhr.abort();
                } else {
                    signal.addEventListener('abort', function () {
                        xhr.abort();
                    });
                }
            }

            xhr.send(formData);
        });
    }

    function readImageMeta(file) {
        if (!file.type || file.type.indexOf('image/') !== 0 || file.type === 'image/svg+xml') {
            return Promise.resolve(null);
        }

        return new Promise(function (resolve) {
            const url = URL.createObjectURL(file);
            const image = new Image();

            image.onload = function () {
                const meta = {
                    width: image.naturalWidth,
                    height: image.naturalHeight
                };
                URL.revokeObjectURL(url);
                resolve(meta);
            };
            image.onerror = function () {
                URL.revokeObjectURL(url);
                resolve(null);
            };
            image.src = url;
        });
    }

    function validateFile(file, meta, options) {
        const messages = options.messages || {};
        const accepted = acceptedList(options.acceptedFiles);

        if (!isAccepted(file, accepted)) {
            return messages.dictInvalidFileType || 'You can\'t upload files of this type';
        }

        if (isInteger(options.maxFilesize) || (typeof options.maxFilesize === 'number' && options.maxFilesize > 0)) {
            if (file.size / 1024 / 1024 > options.maxFilesize) {
                return formatMessage(messages.dictFileTooBig, {
                    filesize: (file.size / 1024 / 1024).toFixed(2),
                    maxFilesize: options.maxFilesize
                });
            }
        }

        if (meta && file.type !== 'image/svg+xml') {
            const width = options.width || {};
            const height = options.height || {};
            const valid = (!isInteger(width.min) || meta.width >= width.min)
                && (!isInteger(width.max) || meta.width <= width.max)
                && (!isInteger(height.min) || meta.height >= height.min)
                && (!isInteger(height.max) || meta.height <= height.max);

            if (!valid) {
                return messages.dictInvalidImageDimension || 'Invalid image dimension';
            }
        }

        return '';
    }

    function serverErrorText(error, messages) {
        if (error && error.payload && typeof error.payload === 'object' && error.payload.error) {
            return String(error.payload.error);
        }

        return formatMessage(messages.dictResponseError || 'An error occurred on the server', {
            statusCode: error && error.status ? error.status : ''
        });
    }

    function appendFileFields(formData, file, options, meta) {
        formData.append('request_id', options.requestId);
        formData.append('type', file.type || '');

        if (meta && meta.width) {
            formData.append('image_width', String(meta.width));
        }

        if (meta && meta.height) {
            formData.append('image_height', String(meta.height));
        }
    }

    function mediaFromResponses(responses) {
        for (let index = responses.length - 1; index >= 0; index -= 1) {
            if (responses[index] && responses[index].id) {
                return responses[index];
            }
        }

        return null;
    }

    function uploadFile(file, options, onProgress, signal) {
        const chunking = options.chunking || {};
        const chunkSize = Number(chunking.chunkSize) > 0 ? Number(chunking.chunkSize) : file.size;
        const useChunks = Boolean(chunking.chunking) && (Boolean(chunking.forceChunking) || file.size > chunkSize);

        return readImageMeta(file).then(function (meta) {
            const validationError = validateFile(file, meta, options);
            if (validationError) {
                const error = new Error(validationError);
                error.validation = true;
                error.meta = meta;
                throw error;
            }

            function withMeta(promise) {
                return promise.then(function (result) {
                    result.meta = meta;
                    return result;
                }).catch(function (error) {
                    error.meta = meta;
                    throw error;
                });
            }

            if (!useChunks) {
                const formData = new FormData();
                appendFileFields(formData, file, options, meta);
                formData.append('file', file, file.name);

                return withMeta(sendFormData(options.uploadUrl, formData, function (loaded) {
                    onProgress(file.size ? loaded / file.size : 1);
                }, signal).then(function (payload) {
                    return { media: payload && payload.id ? payload : null };
                }));
            }

            const total = Math.max(1, Math.ceil(file.size / chunkSize));
            const uuid = createUuid();
            const loadedBytes = new Array(total).fill(0);
            const attempts = chunking.retryChunks ? (Number(chunking.retryChunksLimit) || 1) : 1;

            function report() {
                const sum = loadedBytes.reduce(function (totalLoaded, value) {
                    return totalLoaded + value;
                }, 0);
                onProgress(file.size ? sum / file.size : 1);
            }

            function sendChunk(index) {
                const start = index * chunkSize;
                const blob = file.slice(start, Math.min(file.size, start + chunkSize));
                let attempt = 0;

                function tryOnce() {
                    if (signal.aborted) {
                        const aborted = new Error('abort');
                        aborted.aborted = true;
                        return Promise.reject(aborted);
                    }

                    const formData = new FormData();
                    appendFileFields(formData, file, options, meta);
                    formData.append('file', blob, file.name);
                    formData.append('dzuuid', uuid);
                    formData.append('dzchunkindex', String(index));
                    formData.append('dztotalchunkcount', String(total));
                    formData.append('dztotalfilesize', String(file.size));
                    formData.append('dzchunksize', String(chunkSize));
                    formData.append('dzchunkbyteoffset', String(start));

                    return sendFormData(options.uploadUrl, formData, function (loaded) {
                        loadedBytes[index] = loaded;
                        report();
                    }, signal).catch(function (error) {
                        attempt += 1;
                        if (error.aborted || attempt >= attempts) {
                            throw error;
                        }

                        loadedBytes[index] = 0;
                        return tryOnce();
                    });
                }

                return tryOnce();
            }

            const indexes = [];
            for (let index = 0; index < total; index += 1) {
                indexes.push(index);
            }

            const runner = chunking.parallelChunkUploads
                ? Promise.all(indexes.map(sendChunk))
                : indexes.reduce(function (chain, index) {
                    return chain.then(function (responses) {
                        return sendChunk(index).then(function (response) {
                            responses.push(response);
                            return responses;
                        });
                    });
                }, Promise.resolve([]));

            return withMeta(runner.then(function (responses) {
                return { media: mediaFromResponses(responses) };
            }));
        });
    }

    function cloneFrom(template, selector) {
        const source = template.querySelector(selector);
        if (!source) {
            throw new Error('Preview template is missing.');
        }

        return source.cloneNode(true);
    }

    function setProgress(preview, ratio) {
        const bar = preview.querySelector('[data-gwu-progress]');
        if (!bar) {
            return;
        }

        const percent = Math.max(0, Math.min(100, Math.round(ratio * 100)));
        bar.style.width = percent + '%';
    }

    function setRemoveLabel(preview, text) {
        const label = preview.querySelector('[data-gwu-remove-label]');
        if (label) {
            label.textContent = text;
        }
    }

    function showError(preview, text) {
        preview.classList.remove('gwu-is-uploading');
        preview.classList.add('gwu-has-error');
        const node = preview.querySelector('[data-gwu-error]');
        if (node) {
            node.textContent = text;
        }
    }

    function thumbnailElement(preview) {
        return preview.querySelector('[data-gwu-thumbnail], .js-preview-image');
    }

    function editButton(preview) {
        return preview.querySelector('.js-control-bar-edit-image, .js-control-bar-edit-file, .js-control-bar-edit');
    }

    function applyFieldState(group, input, text, state) {
        if (!group) {
            return;
        }

        if (state === 0) {
            setHidden(group, true);
            return;
        }

        setHidden(group, false);
        if (state === 2) {
            setHidden(input, true);
            setHidden(text, false);
            return;
        }

        setHidden(input, false);
        setHidden(text, true);
    }

    function textOf(element) {
        return element ? element.value : '';
    }

    function setText(element, value) {
        if (!element) {
            return;
        }

        if ('value' in element) {
            element.value = value || '';
        }

        element.textContent = value || '';
    }

    const modal = {
        overlay: null,
        contentWrapper: null,

        ensure: function () {
            if (this.overlay) {
                return;
            }

            const overlay = document.createElement('div');
            overlay.className = 'gwu-modal';
            overlay.innerHTML = ''
                + '<div class="gwu-modal-backdrop" data-gwu-modal-backdrop></div>'
                + '<div class="gwu-modal-dialog" role="dialog" aria-modal="true">'
                + '<button type="button" class="gwu-modal-close" data-gwu-modal-close aria-label="Close">'
                + '<span class="gwu-icon gwu-icon-times"></span>'
                + '</button>'
                + '<div class="gwu-modal-body" data-splash-screen-content-wrapper></div>'
                + '</div>';

            document.body.appendChild(overlay);
            this.overlay = overlay;
            this.contentWrapper = overlay.querySelector('[data-splash-screen-content-wrapper]');

            const self = this;
            overlay.querySelector('[data-gwu-modal-close]').addEventListener('click', function () {
                self.close();
            });
            overlay.querySelector('[data-gwu-modal-backdrop]').addEventListener('click', function () {
                self.close();
            });
            document.addEventListener('keydown', function (event) {
                if (event.key === 'Escape' && overlay.classList.contains('active')) {
                    self.close();
                }
            });
        },

        show: function (content) {
            this.ensure();
            this.contentWrapper.replaceChildren(content);
            document.body.classList.add('gwu-modal-open');
            const overlay = this.overlay;
            window.requestAnimationFrame(function () {
                window.requestAnimationFrame(function () {
                    overlay.classList.add('active');
                });
            });
        },

        close: function () {
            if (!this.overlay) {
                return;
            }

            const overlay = this.overlay;
            const contentWrapper = this.contentWrapper;
            overlay.classList.remove('active');
            document.body.classList.remove('gwu-modal-open');

            const done = function () {
                if (overlay.classList.contains('active')) {
                    return;
                }

                contentWrapper.replaceChildren();
            };
            window.setTimeout(done, 220);
        }
    };

    function CropBox(image, ratio) {
        this.image = image;
        this.ratio = ratio ? Number(ratio) : null;
        this.box = { x: 0, y: 0, w: 0, h: 0 };

        const root = document.createElement('div');
        root.className = 'gwu-crop';
        image.parentNode.insertBefore(root, image);
        root.appendChild(image);

        const frame = document.createElement('div');
        frame.className = 'gwu-crop-box';
        root.appendChild(frame);
        ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].forEach(function (handle) {
            const node = document.createElement('span');
            node.className = 'gwu-crop-handle gwu-crop-handle-' + handle;
            node.dataset.handle = handle;
            frame.appendChild(node);
        });

        this.root = root;
        this.frame = frame;
        this.bind();

        const self = this;
        let tries = 0;
        const layout = function () {
            if (!self.image.clientWidth || !self.image.clientHeight) {
                if (tries < 30) {
                    tries += 1;
                    window.requestAnimationFrame(layout);
                }
                return;
            }

            self.reset();
        };

        image.addEventListener('load', function () {
            tries = 0;
            layout();
        });
        window.requestAnimationFrame(layout);
    }

    CropBox.prototype.bounds = function () {
        return {
            w: this.image.clientWidth,
            h: this.image.clientHeight
        };
    };

    CropBox.prototype.reset = function () {
        const bounds = this.bounds();
        if (!bounds.w || !bounds.h) {
            return;
        }

        if (!this.ratio) {
            this.box = { x: 0, y: 0, w: bounds.w, h: bounds.h };
            this.paint();
            return;
        }

        let width = bounds.w;
        let height = width / this.ratio;
        if (height > bounds.h) {
            height = bounds.h;
            width = height * this.ratio;
        }

        this.box = {
            x: (bounds.w - width) / 2,
            y: (bounds.h - height) / 2,
            w: width,
            h: height
        };
        this.paint();
    };

    CropBox.prototype.paint = function () {
        this.frame.style.left = this.box.x + 'px';
        this.frame.style.top = this.box.y + 'px';
        this.frame.style.width = this.box.w + 'px';
        this.frame.style.height = this.box.h + 'px';
    };

    CropBox.prototype.getData = function () {
        const naturalWidth = this.image.naturalWidth;
        const naturalHeight = this.image.naturalHeight;
        if (!naturalWidth || !naturalHeight) {
            return null;
        }
        const displayWidth = this.image.clientWidth || 1;
        const displayHeight = this.image.clientHeight || 1;
        let x = Math.round(this.box.x * naturalWidth / displayWidth);
        let y = Math.round(this.box.y * naturalHeight / displayHeight);
        let width = Math.round(this.box.w * naturalWidth / displayWidth);
        let height = Math.round(this.box.h * naturalHeight / displayHeight);

        x = Math.max(0, Math.min(x, naturalWidth - 1));
        y = Math.max(0, Math.min(y, naturalHeight - 1));
        width = Math.max(1, Math.min(width, naturalWidth - x));
        height = Math.max(1, Math.min(height, naturalHeight - y));

        return { x: x, y: y, width: width, height: height };
    };

    CropBox.prototype.moveBox = function (start, dx, dy) {
        const bounds = this.bounds();
        const x = Math.min(Math.max(0, start.x + dx), Math.max(0, bounds.w - start.w));
        const y = Math.min(Math.max(0, start.y + dy), Math.max(0, bounds.h - start.h));

        return { x: x, y: y, w: start.w, h: start.h };
    };

    CropBox.prototype.resizeBox = function (start, handle, dx, dy) {
        const bounds = this.bounds();
        const minSize = 24;
        let left = start.x;
        let top = start.y;
        let right = start.x + start.w;
        let bottom = start.y + start.h;
        const west = handle.indexOf('w') !== -1;
        const east = handle.indexOf('e') !== -1;
        const north = handle.indexOf('n') !== -1;
        const south = handle.indexOf('s') !== -1;

        if (east) {
            right += dx;
        }
        if (west) {
            left += dx;
        }
        if (south) {
            bottom += dy;
        }
        if (north) {
            top += dy;
        }

        if (this.ratio && (east || west)) {
            const height = (right - left) / this.ratio;
            if (north) {
                top = bottom - height;
            } else {
                bottom = top + height;
            }
        } else if (this.ratio) {
            const width = (bottom - top) * this.ratio;
            if (west) {
                left = right - width;
            } else {
                right = left + width;
            }
        }

        left = Math.max(0, Math.min(left, bounds.w - minSize));
        top = Math.max(0, Math.min(top, bounds.h - minSize));
        right = Math.max(left + minSize, Math.min(right, bounds.w));
        bottom = Math.max(top + minSize, Math.min(bottom, bounds.h));

        if (this.ratio) {
            const fittedWidth = Math.min(right - left, (bottom - top) * this.ratio);
            const fittedHeight = fittedWidth / this.ratio;
            if (west) {
                left = right - fittedWidth;
            } else {
                right = left + fittedWidth;
            }
            if (north) {
                top = bottom - fittedHeight;
            } else {
                bottom = top + fittedHeight;
            }
            if (left < 0) {
                right -= left;
                left = 0;
            }
            if (top < 0) {
                bottom -= top;
                top = 0;
            }
            if (right > bounds.w) {
                left -= right - bounds.w;
                right = bounds.w;
            }
            if (bottom > bounds.h) {
                top -= bottom - bounds.h;
                bottom = bounds.h;
            }
            left = Math.max(0, left);
            top = Math.max(0, top);
        }

        return {
            x: left,
            y: top,
            w: Math.max(minSize, right - left),
            h: Math.max(minSize, bottom - top)
        };
    };

    CropBox.prototype.bind = function () {
        const self = this;

        this.frame.addEventListener('pointerdown', function (event) {
            if (event.button !== 0) {
                return;
            }

            event.preventDefault();
            const handleNode = event.target.closest('[data-handle]');
            const handle = handleNode ? handleNode.dataset.handle : 'move';
            const start = {
                x: event.clientX,
                y: event.clientY,
                box: {
                    x: self.box.x,
                    y: self.box.y,
                    w: self.box.w,
                    h: self.box.h
                }
            };

            function move(moveEvent) {
                const dx = moveEvent.clientX - start.x;
                const dy = moveEvent.clientY - start.y;
                self.box = handle === 'move'
                    ? self.moveBox(start.box, dx, dy)
                    : self.resizeBox(start.box, handle, dx, dy);
                self.paint();
            }

            function up() {
                window.removeEventListener('pointermove', move);
                window.removeEventListener('pointerup', up);
            }

            window.addEventListener('pointermove', move);
            window.addEventListener('pointerup', up);
        });
    };

    function canCrop(data) {
        return String(data.content_type || '').indexOf('image/') === 0 && data.content_type !== 'image/svg+xml';
    }

    function buildMediaNode(data, kind) {
        if (kind === 'video') {
            const iframe = document.createElement('iframe');
            iframe.className = 'js-iframe';
            iframe.width = String(data.width || 640);
            iframe.height = String(data.height || 360);
            iframe.src = '//www.youtube.com/embed/' + (data.provider_reference || '');
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allowfullscreen', '');
            return iframe;
        }

        if (!data.content_path) {
            return null;
        }

        if (kind !== 'image' && !canCrop(data)) {
            return null;
        }

        const image = document.createElement('img');
        image.className = 'js-image gwu-editor-image';
        image.alt = '';
        if (data.width && data.height) {
            image.width = Number(data.width);
            image.height = Number(data.height);
        }
        image.src = data.content_path;
        return image;
    }

    function openEditor(template, data, options, kind, onSuccess) {
        const source = template.querySelector('.js-splash-screen-content');
        if (!source) {
            return;
        }

        const content = source.cloneNode(true);
        const mediaSlot = content.querySelector('[data-media]');
        const mediaNode = buildMediaNode(data, kind);
        let crop = null;

        if (mediaSlot && mediaNode) {
            mediaSlot.replaceChildren(mediaNode);
        }

        const nameInput = content.querySelector('[data-form-name-input]');
        const nameText = content.querySelector('[data-form-name-text]');
        const descriptionInput = content.querySelector('[data-form-description-input]');
        const descriptionText = content.querySelector('[data-form-description-text]');

        if (nameInput) {
            nameInput.value = data.name || '';
        }
        if (nameText) {
            nameText.textContent = data.name || '';
        }
        if (descriptionInput) {
            descriptionInput.value = data.description || '';
        }
        if (descriptionText) {
            descriptionText.textContent = data.description || '';
        }

        setText(content.querySelector('[data-table-content-type]'), data.content_type || '');
        setText(content.querySelector('[data-table-content-size]'), humanFileSize(Number(data.content_size)));
        setText(content.querySelector('[data-table-width]'), data.width !== null && data.width !== '' ? data.width : '-');
        setText(content.querySelector('[data-table-height]'), data.height !== null && data.height !== '' ? data.height : '-');

        applyFieldState(
            content.querySelector('[data-form-name-group]'),
            nameInput,
            nameText,
            Number(options.nameFieldState)
        );
        applyFieldState(
            content.querySelector('[data-form-description-group]'),
            descriptionInput,
            descriptionText,
            Number(options.descriptionFieldState)
        );

        const saveButton = content.querySelector('[data-save-button]');
        const saveButtonText = saveButton ? saveButton.textContent : '';

        if (saveButton) {
            saveButton.addEventListener('click', function () {
                if (!options.editUrl || !options.requestId || !data.id) {
                    window.alert('Save failed.');
                    return;
                }

                const body = new URLSearchParams();
                body.set('id', data.id);
                body.set('request_id', options.requestId);
                body.set('name', textOf(nameInput));
                body.set('description', textOf(descriptionInput));
                if (crop) {
                    const cropData = crop.getData();
                    if (cropData) {
                        body.set('crop_data', JSON.stringify(cropData));
                    }
                }

                saveButton.disabled = true;
                saveButton.textContent = options.saveButtonLoadingText || 'Saving...';

                postForm(options.editUrl, body).then(function (result) {
                    saveButton.disabled = false;
                    saveButton.textContent = saveButtonText;

                    if (!result.ok || !result.payload || !result.payload.media) {
                        window.alert('Save failed.');
                        return;
                    }

                    onSuccess(result.payload.media);
                    modal.close();
                }).catch(function () {
                    saveButton.disabled = false;
                    saveButton.textContent = saveButtonText;
                    window.alert('Save failed.');
                });
            });
        }

        modal.show(content);
        if (mediaNode && mediaNode.tagName === 'IMG' && canCrop(data)) {
            crop = new CropBox(mediaNode, options.cropperRatio);
        }
    }

    function enableReorder(container, itemSelector, onSort) {
        let dragged = null;
        let placeholder = null;
        let pointerId = null;
        let startX = 0;
        let startY = 0;
        let active = false;

        function itemAt(x, y) {
            if (dragged) {
                dragged.style.pointerEvents = 'none';
            }

            const node = document.elementFromPoint(x, y);

            if (dragged) {
                dragged.style.pointerEvents = '';
            }

            if (!node) {
                return null;
            }

            const target = node.closest(itemSelector);
            if (!target || target === dragged || !container.contains(target)) {
                return null;
            }

            return target;
        }

        function moveSlot(x, y) {
            const target = itemAt(x, y);
            if (!target || !placeholder) {
                return;
            }

            const rect = target.getBoundingClientRect();
            const sameRow = y >= rect.top && y <= rect.bottom;
            const after = sameRow ? x > rect.left + rect.width / 2 : y > rect.top + rect.height / 2;
            const next = after ? target.nextSibling : target;
            if (next !== placeholder) {
                container.insertBefore(placeholder, next);
            }
        }

        function finish() {
            const item = dragged;
            const slot = placeholder;
            dragged = null;
            placeholder = null;
            pointerId = null;
            active = false;

            if (item) {
                item.classList.remove('gwu-is-dragging');
                item.style.pointerEvents = '';
            }

            if (slot && slot.parentNode && item) {
                slot.replaceWith(item);
                onSort();
                return;
            }

            if (slot) {
                slot.remove();
            }
        }

        container.addEventListener('dragstart', function (event) {
            event.preventDefault();
        });

        container.addEventListener('pointerdown', function (event) {
            if (event.button !== 0 || dragged) {
                return;
            }

            const item = event.target.closest(itemSelector);
            if (!item || !container.contains(item) || event.target.closest('button, a, input, textarea, select')) {
                return;
            }

            dragged = item;
            pointerId = event.pointerId;
            startX = event.clientX;
            startY = event.clientY;
            item.setPointerCapture(event.pointerId);
        });

        container.addEventListener('pointermove', function (event) {
            if (!dragged || event.pointerId !== pointerId) {
                return;
            }

            if (!active) {
                if (Math.abs(event.clientX - startX) < 6 && Math.abs(event.clientY - startY) < 6) {
                    return;
                }

                active = true;
                placeholder = document.createElement('div');
                placeholder.className = 'gwu-drag-placeholder';
                placeholder.style.width = dragged.offsetWidth + 'px';
                placeholder.style.height = dragged.offsetHeight + 'px';
                dragged.after(placeholder);
                dragged.classList.add('gwu-is-dragging');
            }

            moveSlot(event.clientX, event.clientY);
        });

        function endPointer(event) {
            if (!dragged || event.pointerId !== pointerId) {
                return;
            }

            finish();
        }

        container.addEventListener('pointerup', endPointer);
        container.addEventListener('pointercancel', endPointer);
    }

    function writeMediaOrder(field, container, itemSelector) {
        if (!field) {
            return;
        }

        let data = {};
        try {
            data = JSON.parse(field.value || '{}');
        } catch (error) {
            data = {};
        }

        data.medias = Array.prototype.map.call(container.querySelectorAll(itemSelector), function (preview) {
            return preview.getAttribute('data-id');
        }).filter(Boolean);
        field.value = JSON.stringify(data);
    }

    function bindPicker(zone, accepted, multiple, onFiles) {
        if (!zone) {
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.tabIndex = -1;
        input.className = 'gwu-file-input';
        input.multiple = Boolean(multiple);
        if (accepted.length) {
            input.accept = accepted.join(',');
        }

        zone.classList.add('gwu-clickable');
        zone.appendChild(input);
        zone.addEventListener('click', function (event) {
            if (event.target === input) {
                return;
            }

            input.click();
        });
        input.addEventListener('change', function () {
            onFiles(input.files);
            input.value = '';
        });
        function acceptsFiles(dataTransfer) {
            if (!dataTransfer || !dataTransfer.types) {
                return false;
            }

            const types = dataTransfer.types;
            if (!types.length) {
                return true;
            }

            return Array.prototype.indexOf.call(types, 'Files') !== -1;
        }

        zone.addEventListener('dragover', function (event) {
            if (!acceptsFiles(event.dataTransfer)) {
                return;
            }

            event.preventDefault();
            zone.classList.add('gwu-is-dragover');
        });
        zone.addEventListener('dragleave', function () {
            zone.classList.remove('gwu-is-dragover');
        });
        zone.addEventListener('drop', function (event) {
            if (!event.dataTransfer || !event.dataTransfer.files.length) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            zone.classList.remove('gwu-is-dragover');
            onFiles(multiple ? event.dataTransfer.files : [event.dataTransfer.files[0]]);
        });
    }

    function deleteMedia(options, id) {
        if (!id || !options.deleteUrl) {
            return;
        }

        const body = new URLSearchParams();
        body.set('id', id);
        body.set('request_id', options.requestId);
        postForm(options.deleteUrl, body);
    }

    function mountFiles(root, options, config) {
        const messages = options.messages || {};
        const previewContainer = root.querySelector(config.previewSelector);
        const template = root.querySelector(config.templateSelector);
        const placeholder = root.querySelector(config.placeholderSelector);
        const field = root.querySelector('.js-field-value');
        const accepted = acceptedList(options.acceptedFiles);

        function syncPlaceholder() {
            if (!placeholder || config.multiple) {
                return;
            }

            setHidden(placeholder, Boolean(previewContainer.querySelector(config.itemSelector)));
        }

        function removePreview(preview, confirmCancel) {
            const state = preview._gwuUpload;
            if (state && state.uploading) {
                if (confirmCancel && !window.confirm(messages.dictCancelUploadConfirmation || 'Are you sure you want to cancel this upload?')) {
                    return;
                }

                state.removed = true;
                state.controller.abort();
            } else {
                deleteMedia(options, preview.getAttribute('data-id'));
            }

            if (state && state.localUrl) {
                URL.revokeObjectURL(state.localUrl);
                state.localUrl = '';
            }

            preview.remove();
            syncPlaceholder();
            if (config.multiple) {
                writeMediaOrder(field, previewContainer, config.itemSelector);
            }
        }

        function finishPreview(preview, media, localUrl) {
            preview._gwuUpload.uploading = false;
            preview.classList.remove('gwu-is-uploading');

            const image = thumbnailElement(preview);
            if (!media || !media.id) {
                if (image && localUrl) {
                    image.src = localUrl;
                }
                showError(preview, messages.dictResponseError || 'An error occurred on the server');
                setRemoveLabel(preview, messages.dictRemoveFile || 'Remove');
                return;
            }

            setPreviewData(preview, media);
            if (image && media.thumbnail_path) {
                image.src = media.thumbnail_path;
                if (localUrl) {
                    URL.revokeObjectURL(localUrl);
                    preview._gwuUpload.localUrl = '';
                }
            } else if (image && localUrl && !image.getAttribute('src')) {
                image.src = localUrl;
            }

            setHidden(editButton(preview), false);
            setRemoveLabel(preview, messages.dictRemoveFile || 'Remove');
            if (config.multiple) {
                writeMediaOrder(field, previewContainer, config.itemSelector);
            }
            syncPlaceholder();
        }

        function startUpload(file) {
            if (!config.multiple) {
                const current = previewContainer.querySelector(config.itemSelector);
                if (current) {
                    removePreview(current, false);
                }
            }

            const preview = cloneFrom(template, config.itemSelector);
            const controller = new AbortController();
            let localPreviewUrl = '';
            if (file.type && file.type.indexOf('image/') === 0) {
                localPreviewUrl = URL.createObjectURL(file);
                const image = thumbnailElement(preview);
                if (image) {
                    image.src = localPreviewUrl;
                }
            }
            preview._gwuUpload = {
                uploading: true,
                controller: controller,
                removed: false,
                localUrl: localPreviewUrl
            };
            preview.classList.add('gwu-is-uploading');
            if (config.multiple) {
                preview.classList.add('gwu-draggable');
            }

            const name = preview.querySelector('.js-file-name');
            if (name) {
                name.textContent = file.name;
            }

            setRemoveLabel(preview, messages.dictCancelUpload || 'Cancel upload');
            setHidden(editButton(preview), true);
            previewContainer.appendChild(preview);
            syncPlaceholder();

            const removeControl = preview.querySelector('[data-gwu-remove]');
            if (removeControl) {
                removeControl.addEventListener('click', function () {
                    removePreview(preview, true);
                });
            }

            const editControl = editButton(preview);
            if (editControl) {
                editControl.addEventListener('click', function () {
                    openEditor(root, getPreviewData(preview), options, config.kind, function (media) {
                        setPreviewData(preview, media);
                        const image = thumbnailElement(preview);
                        if (image && media.thumbnail_path) {
                            image.src = media.thumbnail_path;
                        }
                        if (name && media.name) {
                            name.textContent = media.name;
                        }
                    });
                });
            }

            uploadFile(file, options, function (ratio) {
                setProgress(preview, ratio);
            }, controller.signal).then(function (result) {
                if (preview._gwuUpload.removed) {
                    return;
                }

                finishPreview(preview, result.media, preview._gwuUpload.localUrl);
            }).catch(function (error) {
                if (preview._gwuUpload.removed || error.aborted) {
                    return;
                }

                preview._gwuUpload.uploading = false;
                showError(preview, error.validation ? error.message : serverErrorText(error, messages));
                setRemoveLabel(preview, messages.dictRemoveFile || 'Remove');
            });
        }

        function addExisting(media) {
            if (!media || !media.id) {
                return;
            }

            const preview = cloneFrom(template, config.itemSelector);
            preview._gwuUpload = { uploading: false, controller: null, removed: false };
            setPreviewData(preview, media);
            if (config.multiple) {
                preview.classList.add('gwu-draggable');
            }

            const image = thumbnailElement(preview);
            if (image && media.thumbnail_path) {
                image.src = media.thumbnail_path;
            }

            const name = preview.querySelector('.js-file-name');
            if (name) {
                name.textContent = media.name || '';
            }

            setRemoveLabel(preview, messages.dictRemoveFile || 'Remove');
            setHidden(editButton(preview), false);
            previewContainer.appendChild(preview);

            const removeControl = preview.querySelector('[data-gwu-remove]');
            if (removeControl) {
                removeControl.addEventListener('click', function () {
                    removePreview(preview, false);
                });
            }

            const editControl = editButton(preview);
            if (editControl) {
                editControl.addEventListener('click', function () {
                    openEditor(root, getPreviewData(preview), options, config.kind, function (saved) {
                        setPreviewData(preview, saved);
                        if (image && saved.thumbnail_path) {
                            image.src = saved.thumbnail_path;
                        }
                        if (name && saved.name) {
                            name.textContent = saved.name;
                        }
                    });
                });
            }
        }

        const existing = config.multiple
            ? (Array.isArray(options.files) ? options.files : [])
            : (options.file && options.file.id ? [options.file] : []);

        existing.forEach(addExisting);
        syncPlaceholder();

        bindPicker(root.querySelector(config.pickerSelector), accepted, config.multiple, function (files) {
            Array.prototype.forEach.call(files, startUpload);
        });

        if (config.multiple) {
            enableReorder(previewContainer, config.itemSelector, function () {
                writeMediaOrder(field, previewContainer, config.itemSelector);
            });
        }
    }

    function mountVideos(root, options) {
        const multiple = options.type === 'video-collection';
        const previewContainer = root.querySelector('.js-preview-wrapper');
        const template = root.querySelector('.js-preview-template');
        const field = root.querySelector('.js-field-value');
        const input = root.querySelector('.js-upload-input');
        const button = root.querySelector('.js-control-bar-upload-video');
        const buttonText = button ? button.textContent : '';
        const loadingText = options.messages && options.messages.uploadVideoLoadingText
            ? options.messages.uploadVideoLoadingText
            : 'Uploading...';

        function addPreview(media, stored) {
            if (!media || !media.id) {
                return null;
            }

            const preview = cloneFrom(template, '.js-preview');
            setPreviewData(preview, media);
            if (stored) {
                preview.setAttribute('data-gwu-stored', '1');
            }
            if (multiple) {
                preview.classList.add('gwu-draggable');
            }

            const image = preview.querySelector('.js-preview-image');
            if (image && media.thumbnail_path) {
                image.src = media.thumbnail_path;
            }

            previewContainer.appendChild(preview);
            return preview;
        }

        function syncOrder() {
            if (multiple) {
                writeMediaOrder(field, previewContainer, '.js-preview');
            }
        }

        const initial = multiple
            ? (Array.isArray(options.medias) ? options.medias : [])
            : (options.media && options.media.id ? [options.media] : []);

        initial.forEach(function (media, index) {
            addPreview(media, !multiple && index === 0);
        });

        if (button) {
            button.addEventListener('click', function () {
                const link = input ? input.value.trim() : '';
                if (!link || !options.uploadUrl) {
                    return;
                }

                button.disabled = true;
                button.textContent = loadingText;

                const body = new URLSearchParams();
                body.set('file_link', link);
                body.set('request_id', options.requestId);

                postForm(options.uploadUrl, body).then(function (result) {
                    button.disabled = false;
                    button.textContent = buttonText;

                    if (!result.ok || !result.payload || !result.payload.id) {
                        window.alert('Upload video failed.');
                        return;
                    }

                    if (input) {
                        input.value = '';
                    }

                    if (!multiple) {
                        previewContainer.querySelectorAll('.js-preview:not([data-gwu-stored])').forEach(function (preview) {
                            preview.remove();
                        });
                        const stored = previewContainer.querySelector('[data-gwu-stored]');
                        if (stored) {
                            setHidden(stored, true);
                        }
                    }

                    addPreview(result.payload, false);
                    syncOrder();
                }).catch(function () {
                    button.disabled = false;
                    button.textContent = buttonText;
                    window.alert('Upload video failed.');
                });
            });
        }

        previewContainer.addEventListener('click', function (event) {
            const preview = event.target.closest('.js-preview');
            if (!preview || !previewContainer.contains(preview)) {
                return;
            }

            if (event.target.closest('.js-control-bar-edit')) {
                openEditor(root, getPreviewData(preview), options, 'video', function (media) {
                    setPreviewData(preview, media);
                });
                return;
            }

            if (!event.target.closest('.js-control-bar-delete')) {
                return;
            }

            const id = preview.getAttribute('data-id');
            const body = new URLSearchParams();
            body.set('id', id || '');
            body.set('request_id', options.requestId);

            if (!id || !options.deleteUrl) {
                window.alert('To remove the video failed.');
                return;
            }

            postForm(options.deleteUrl, body).then(function (result) {
                if (!result.ok) {
                    window.alert('To remove the video failed.');
                    return;
                }

                const stored = preview.hasAttribute('data-gwu-stored');
                preview.remove();
                if (!multiple && !stored) {
                    const previous = previewContainer.querySelector('[data-gwu-stored]');
                    if (previous) {
                        setHidden(previous, false);
                    }
                }
                syncOrder();
            }).catch(function () {
                window.alert('To remove the video failed.');
            });
        });

        if (multiple) {
            enableReorder(previewContainer, '.js-preview', syncOrder);
        }
    }

    function mount(element, options) {
        if (!element || element.getAttribute('data-gwu-mounted') === '1') {
            return;
        }

        element.setAttribute('data-gwu-mounted', '1');
        options = options || {};

        if (options.type === 'image' || options.type === 'image-collection') {
            mountFiles(element, options, {
                kind: 'image',
                multiple: options.type === 'image-collection',
                previewSelector: '.js-upload-preview-wrapper',
                templateSelector: '.js-upload-preview-template-wrapper',
                placeholderSelector: '.js-upload-image-wrapper',
                pickerSelector: '.gwu-dropzone',
                itemSelector: '.js-dropzone-file'
            });
            return;
        }

        if (options.type === 'file') {
            mountFiles(element, options, {
                kind: 'file',
                multiple: false,
                previewSelector: '.js-preview-wrapper',
                templateSelector: '.js-preview-template-wrapper',
                placeholderSelector: '.js-upload-file-wrapper',
                pickerSelector: '.js-upload-file-wrapper',
                itemSelector: '.js-dropzone-file'
            });
            return;
        }

        if (options.type === 'video' || options.type === 'video-collection') {
            mountVideos(element, options);
        }
    }

    window.Gwu = { mount: mount };
})();
