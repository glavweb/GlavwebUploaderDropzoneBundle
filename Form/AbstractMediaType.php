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

use Doctrine\Bundle\DoctrineBundle\Registry;
use Glavweb\UploaderBundle\Entity\Media;
use Glavweb\UploaderBundle\Manager\UploaderManager;
use Glavweb\UploaderBundle\Model\MediaInterface;
use Glavweb\UploaderBundle\Util\MediaStructure;
use Symfony\Bundle\FrameworkBundle\Routing\Router;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\CallbackTransformer;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\FormInterface;
use Symfony\Component\Form\FormView;
use Symfony\Component\OptionsResolver\OptionsResolver;

/**
 * Class AbstractMediaType
 *
 * @package Glavweb\UploaderDropzoneBundle
 * @author Andrey Nilov <nilov@glavweb.ru>
 */
abstract class AbstractMediaType extends AbstractType
{
    /**
     * @var Router
     */
    protected $router;

    /**
     * @var Registry
     */
    protected $doctrine;

    /**
     * @var UploaderManager
     */
    protected $uploaderManager;

    /**
     * @var MediaStructure
     */
    protected $mediaStructure;

    /**
     * AbstractMediaType constructor.
     *
     * @param Router          $router
     * @param Registry        $doctrine
     * @param UploaderManager $uploaderManager
     * @param MediaStructure  $mediaStructure
     */
    public function __construct(Router $router, Registry $doctrine, UploaderManager $uploaderManager, MediaStructure $mediaStructure)
    {
        $this->router          = $router;
        $this->doctrine        = $doctrine;
        $this->uploaderManager = $uploaderManager;
        $this->mediaStructure  = $mediaStructure;
    }

    /**
     * @param FormView $view
     * @param FormInterface $form
     * @param array $options
     */
    public function buildView(FormView $view, FormInterface $form, array $options)
    {
        $requestId = $options['requestId'] ?: $this->generateRequestId($view);

        $view->vars['requestId'] = $requestId;

        $view->vars['uploadUrl'] = $this->router->generate('glavweb_uploader_upload', [
            'context'          => $options['context'],
            'thumbnail_filter' => $options['thumbnail_filter']
        ]);

        $view->vars['deleteUrl'] = $this->router->generate('glavweb_uploader_delete');
        $view->vars['editUrl']   = $this->router->generate('glavweb_uploader_edit');
    }

    /**
     * @param OptionsResolver $resolver
     */
    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults([
            'compound'         => false,
            'requestId'        => null,
            'context'          => null,
            'thumbnail_filter' => null,
        ]);
    }

    /**
     * @param FormView $view
     * @return mixed
     */
    private function generateRequestId(FormView $view)
    {
        return $view->vars['id'] . '_' . uniqid();
    }

    /**
     * @param string $securedId Media ID with token like as "id-token"
     * @return MediaInterface|null
     */
    protected function getMedia($securedId)
    {
        return $this->doctrine->getManager()->getRepository(Media::class)->findOneBySecuredId($securedId);
    }

    /**
     * @param array $securedIds Array of media ID with token like as "id-token"
     * @return MediaInterface[]
     */
    protected function getMedias(array $securedIds)
    {
        $medias = [];
        foreach ($securedIds as $securedId) {
            $medias[] = $this->getMedia($securedId);
        }

        return $medias;
    }
}
