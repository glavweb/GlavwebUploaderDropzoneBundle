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

/**
 * Class ImageCollectionType
 *
 * @package Glavweb\UploaderDropzoneBundle
 * @author Andrey Nilov <nilov@glavweb.ru>
 */
class ImageCollectionType extends AbstractMediaCollectionType
{
    /**
     * {@inheritdoc}
     */
    public function getBlockPrefix()
    {
        return 'cms_media_image_collection';
    }
}
