/**
 * jQuery object
 * @external jQuery
 * @see {@link http://api.jquery.com/jQuery/}
 */

/**
 * SplashScreen
 *
 * @author Andrey Nilov <nilov@glavweb.ru>
 */
(function ($) {
    /**
     * Constructor
     *
     * @param {jQuery} $wrapper
     * @param {object} options
     * @constructor
     */
    function SplashScreen($wrapper, options)
    {
        this.wrapper = $wrapper;
        this.defaultTemplate =
            '<div class="splash-screen">' +
                '<button data-splash-screen-close-button type="button" class="splash-screen-btn-close" data-method="clear" title="Clear">' +
                    '<span class="splash-screen-btn-close__remove"></span>' +
                    '<span class="splash-screen-btn-close__remove"></span>' +
                '</button>' +
                '<div class="splash-screen-dt"><div class="splash-screen-dtc"><div data-splash-screen-content-wrapper></div></div></div>' +
            '</div>'
        ;

        this.options = $.extend({
            template: this.defaultTemplate
        }, options);

        this.template = $(this.options.template);

        this.ui = {
            body           : $('body'),
            contentWrapper : this.template.find('[data-splash-screen-content-wrapper]'),
            closeButton    : this.template.find('[data-splash-screen-close-button]')
        };

        this.currentScrollTop = 0;

        this.init();
        this.defineListeners();
    }

    /**
     * Define listeners
     */
    SplashScreen.prototype.defineListeners = function ()
    {
        var self = this;

        this.ui.closeButton.on('click', function () {
            self.close();
        })
    };

    /**
     * Init splash screen
     */
    SplashScreen.prototype.init = function ()
    {
        this.ui.body.prepend(this.template);
    };

    /**
     * Set content for splash screen and show
     */
    SplashScreen.prototype.content = function (html)
    {
        this.ui.contentWrapper.html(html);
        this.show();
    };

    /**
     * Show splash screen
     */
    SplashScreen.prototype.show = function ()
    {
        this.currentScrollTop = this.ui.body.scrollTop();
        this.ui.body.children().addClass('splash-screen-hide');

        this.template.addClass('active');
        this.template.removeClass('splash-screen-hide');
    };

    /**
     * Close splash screen
     */
    SplashScreen.prototype.close = function () {
        $('.splash-screen-hide').removeClass('splash-screen-hide');

        this.template.removeClass('active');
        this.destroyContent();

        this.ui.body.scrollTop(this.currentScrollTop);
    };

    /**
     * Close splash screen
     */
    SplashScreen.prototype.destroyContent = function () {
        this.ui.contentWrapper.html('');
    };

    /**
     * Init plugin
     *
     * @param options
     * @returns {SplashScreen}
     */
    $.fn.splashScreen = function (options) {
        return new SplashScreen(this, options);
    };

})(jQuery);