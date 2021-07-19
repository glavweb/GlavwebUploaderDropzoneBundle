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
use Symfony\Component\OptionsResolver\OptionsResolver;

/**
 * Class ImageType
 *
 * @package Glavweb\UploaderDropzoneBundle
 * @author Andrey Nilov <nilov@glavweb.ru>
 */
class ImageType extends AbstractMediaItemType
{
    /**
     * {@inheritdoc}
     */
    public function getBlockPrefix()
    {
        return 'cms_media_image';
    }

    /**
     * @param FormView $view
     * @param FormInterface $form
     * @param array $options
     */
    public function buildView(FormView $view, FormInterface $form, array $options)
    {
        parent::buildView($view, $form, $options);

        $view->vars['thumbnailWidth'] = $options['thumbnail_width'];
        $view->vars['thumbnailHeight'] = $options['thumbnail_height'];
        $view->vars['cropperRatio'] = $options['cropper_ratio'];
    }

    /**
     * @param OptionsResolver $resolver
     */
    public function configureOptions(OptionsResolver $resolver)
    {
        parent::configureOptions($resolver);

        $resolver->setDefaults([
            'thumbnail_width'  => 250,
            'thumbnail_height' => 250,
            'cropper_ratio'    => 1
        ]);

        $resolver->setAllowedTypes('thumbnail_width', 'int');
        $resolver->setAllowedTypes('thumbnail_height', 'int');
        $resolver->setAllowedTypes('cropper_ratio', ['float', 'int']);
    }
}
