<?php

namespace Glavweb\UploaderDropzoneBundle\Enum;

/**
 * Class FieldState.
 *
 * @author  Sergey Zvyagintsev <nitron.ru@gmail.com>
 */
class FieldState
{
    public const HIDDEN = 0;

    public const VISIBLE = 1 << 1;

    public const EDITABLE = self::VISIBLE | 1 << 2;

    /**
     * @return array<int, int>
     */
    public static function getValues(): array
    {
        return [self::HIDDEN, self::VISIBLE, self::EDITABLE];
    }
}
