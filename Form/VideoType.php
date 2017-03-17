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
 * Class VideoType
 *
 * @package Glavweb\UploaderDropzoneBundle
 * @author Andrey Nilov <nilov@glavweb.ru>
 */
class VideoType extends AbstractMediaItemType
{
    /**
     * @param FormView $view
     * @param FormInterface $form
     * @param array $options
     */
    public function buildView(FormView $view, FormInterface $form, array $options)
    {
        parent::buildView($view, $form, $options);

        $view->vars['uploadUrl'] = $this->router->generate('glavweb_uploader_uploadlink', [
            'context'          => $options['context'],
            'thumbnail_filter' => $options['thumbnail_filter']
        ]);
    }

    /**
     * {@inheritdoc}
     */
    public function getBlockPrefix()
    {
        return 'cms_media_video';
    }
}
