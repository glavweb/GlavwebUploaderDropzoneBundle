<?php

namespace Glavweb\UploaderDropzoneBundle\Form;

use Symfony\Component\Form\FormInterface;
use Symfony\Component\Form\FormView;

/**
 * Class VideoCollectionType.
 */
class VideoCollectionType extends AbstractMediaCollectionType
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
        return 'cms_media_video_collection';
    }
}
