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
     * @var array
     */
    protected $config;

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
    public function __construct(array $config, Router $router, Registry $doctrine, UploaderManager $uploaderManager, MediaStructure $mediaStructure)
    {
        $this->config          = $config;
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

        $view->vars['requestId']       = $requestId;
        $view->vars['maxFilesize']     = $options['max_filesize'];
        $view->vars['acceptedFiles']   = $options['accepted_files'];

        $view->vars['chunkingOptions'] = [
            'chunking'             => $options['chunking'],
            'forceChunking'        => $options['force_chunking'],
            'chunkSize'            => $options['chunk_size'],
            'parallelChunkUploads' => $options['parallel_chunk_uploads'],
            'retryChunks'          => $options['retry_chunks'],
            'retryChunksLimit'     => $options['retry_chunks_limit']
        ];

        $view->vars['uploadUrl']       = $this->router->generate('glavweb_uploader_upload', [
            'context'          => $options['context'],
            'thumbnail_filter' => $options['thumbnail_filter']
        ]);

        $view->vars['deleteUrl']       = $this->router->generate('glavweb_uploader_delete');
        $view->vars['editUrl']         = $this->router->generate('glavweb_uploader_edit');
    }

    /**
     * @param OptionsResolver $resolver
     */
    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults([
            'compound'               => false,
            'requestId'              => null,
            'context'                => null,
            'thumbnail_filter'       => null,
            'max_filesize'           => $this->config['max_filesize'],
            'accepted_files'         => null,
            'chunking'               => $this->config['chunking'],
            'force_chunking'         => $this->config['force_chunking'],
            'chunk_size'             => $this->config['chunk_size'],
            'parallel_chunk_uploads' => $this->config['parallel_chunk_uploads'],
            'retry_chunks'           => $this->config['retry_chunks'],
            'retry_chunks_limit'     => $this->config['retry_chunks_limit'],
        ]);

        $resolver->setAllowedTypes('compound', 'bool');
        $resolver->setAllowedTypes('requestId', ['string', 'null']);
        $resolver->setAllowedTypes('context', ['string', 'null']);
        $resolver->setAllowedTypes('thumbnail_filter', ['string', 'null']);
        $resolver->setAllowedTypes('max_filesize', 'int');
        $resolver->setAllowedTypes('accepted_files', ['null', 'array']);
        $resolver->setAllowedTypes('chunking', 'bool');
        $resolver->setAllowedTypes('force_chunking', 'bool');
        $resolver->setAllowedTypes('chunk_size', 'int');
        $resolver->setAllowedTypes('parallel_chunk_uploads', 'bool');
        $resolver->setAllowedTypes('retry_chunks', 'bool');
        $resolver->setAllowedTypes('retry_chunks_limit', 'int');
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
