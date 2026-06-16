<?php

/*
 * This file is part of the Glavweb UploaderDropzoneBundle package.
 *
 * (c) Andrey Nilov <nilov@glavweb.ru>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Glavweb\UploaderDropzoneBundle\Form;

use Symfony\Component\Form\FormInterface;
use Symfony\Component\Form\FormView;

/**
 * Class VideoType.
 *
 * @author Andrey Nilov <nilov@glavweb.ru>
 */
class VideoType extends AbstractMediaItemType
{
    #[\Override]
    public function buildView(FormView $view, FormInterface $form, array $options): void
    {
        parent::buildView($view, $form, $options);

        $view->vars['uploadUrl'] = $this->router->generate('glavweb_uploader_uploadlink', [
            'context' => $options['context'],
            'thumbnail_filter' => $options['thumbnail_filter'],
        ]);
    }

    #[\Override]
    public function getBlockPrefix(): string
    {
        return 'cms_media_video';
    }
}
