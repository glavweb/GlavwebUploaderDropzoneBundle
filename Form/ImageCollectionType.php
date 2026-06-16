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
 * Class ImageCollectionType.
 *
 * @author Andrey Nilov <nilov@glavweb.ru>
 */
class ImageCollectionType extends AbstractMediaCollectionType
{
    #[\Override]
    public function getBlockPrefix(): string
    {
        return 'cms_media_image_collection';
    }

    #[\Override]
    public function buildView(FormView $view, FormInterface $form, array $options): void
    {
        parent::buildView($view, $form, $options);

        $view->vars['cropperRatio'] = $options['cropper_ratio'] ?? null;
    }

    #[\Override]
    public function configureOptions(OptionsResolver $resolver): void
    {
        parent::configureOptions($resolver);

        $resolver->setDefined([
            'cropper_ratio',
        ]);

        $resolver->setAllowedTypes('cropper_ratio', ['float', 'int']);
    }
}
