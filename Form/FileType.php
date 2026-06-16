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
 * Class FileType.
 *
 * @author Andrey Nilov <nilov@glavweb.ru>
 */
class FileType extends AbstractMediaItemType
{
    #[\Override]
    public function getBlockPrefix(): string
    {
        return 'media_file';
    }
}
