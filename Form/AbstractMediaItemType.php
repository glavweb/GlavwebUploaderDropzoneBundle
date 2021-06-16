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

use Glavweb\UploaderBundle\Model\MediaInterface;
use Symfony\Component\Form\CallbackTransformer;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\FormInterface;
use Symfony\Component\Form\FormView;

/**
 * Class AbstractMediaItemType
 *
 * @package Glavweb\UploaderDropzoneBundle
 * @author Andrey Nilov <nilov@glavweb.ru>
 */
class AbstractMediaItemType extends AbstractMediaType
{
    /**
     * @param FormBuilderInterface $builder
     * @param array $options
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder->addModelTransformer(new CallbackTransformer(
            function ($media) {
                return $media;
            },

            function ($mediaDataJson) {
                $mediaData = json_decode($mediaDataJson, true);

                $uploadedMedias = $this->uploaderManager->handleUpload($mediaData['request_id']);

                if (isset($uploadedMedias[0]) && $uploadedMedias[0] instanceof MediaInterface) {
                    return $uploadedMedias[0];
                }

                return $this->getMedia($mediaData['media']);
            }
        ));
    }

    /**
     * @param FormView $view
     * @param FormInterface $form
     * @param array $options
     */
    public function buildView(FormView $view, FormInterface $form, array $options)
    {
        parent::buildView($view, $form, $options);

        $mediaSecuredId  = null;
        $structuredMedia = null;

        $media = $view->vars['value'];
        if ($media instanceof MediaInterface) {
            $structuredMedia = $this->mediaStructure->getMediaStructure($media, $options['thumbnail_filter'], true);
            $mediaSecuredId  = $structuredMedia['id'];
        }

        $view->vars['value'] = $structuredMedia;

        // Переименовать в value
        $view->vars['mediaData'] = [
            'media'      => $mediaSecuredId,
            'request_id' => $view->vars['requestId']
        ];
    }
}
