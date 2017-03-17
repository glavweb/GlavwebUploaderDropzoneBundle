<?php

namespace Glavweb\UploaderDropzoneBundle\Form;
use Symfony\Component\Form\FormInterface;
use Symfony\Component\Form\FormView;

/**
 * Class VideoCollectionType
 * @package Glavweb\UploaderDropzoneBundle\Form
 */
class VideoCollectionType extends AbstractMediaCollectionType
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
        return 'cms_media_video_collection';
    }
}
