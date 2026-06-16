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
 * Class ImageType.
 *
 * @author Andrey Nilov <nilov@glavweb.ru>
 */
class ImageType extends AbstractMediaItemType
{
    #[\Override]
    public function getBlockPrefix(): string
    {
        return 'cms_media_image';
    }

    #[\Override]
    public function buildView(FormView $view, FormInterface $form, array $options): void
    {
        parent::buildView($view, $form, $options);

        $view->vars['thumbnailWidth'] = $options['thumbnail_width'];
        $view->vars['thumbnailHeight'] = $options['thumbnail_height'];
        $view->vars['cropperRatio'] = $options['cropper_ratio'] ?? null;
    }

    #[\Override]
    public function configureOptions(OptionsResolver $resolver): void
    {
        parent::configureOptions($resolver);

        $resolver->setDefined([
            'cropper_ratio',
        ]);
        $resolver->setDefaults([
            'thumbnail_width' => 250,
            'thumbnail_height' => 250,
        ]);

        $resolver->setAllowedTypes('thumbnail_width', 'int');
        $resolver->setAllowedTypes('thumbnail_height', 'int');
        $resolver->setAllowedTypes('cropper_ratio', ['float', 'int']);
    }
}
