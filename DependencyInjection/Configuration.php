<?php

/*
 * This file is part of the Glavweb UploaderDropzoneBundle package.
 *
 * (c) Andrey Nilov <nilov@glavweb.ru>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Glavweb\UploaderDropzoneBundle\DependencyInjection;

use Symfony\Component\Config\Definition\Builder\TreeBuilder;
use Symfony\Component\Config\Definition\ConfigurationInterface;

/**
 * This is the class that validates and merges configuration from your app/config files
 *
 * To learn more see {@link http://symfony.com/doc/current/cookbook/bundles/extension.html#cookbook-bundles-extension-config-class}
 *
 * @package Glavweb\UploaderDropzoneBundle
 * @author Andrey Nilov <nilov@glavweb.ru>
 */
class Configuration implements ConfigurationInterface
{
    /**
     * {@inheritdoc}
     */
    public function getConfigTreeBuilder()
    {
        $treeBuilder = new TreeBuilder('glavweb_uploader_dropzone');
        $rootNode = $treeBuilder->getRootNode();

        $rootNode
            ->children()
                ->scalarNode('max_filesize')
                    ->info('Max file size in Megabites')->defaultValue(256)->end()
                ->scalarNode('chunking')
                    ->defaultFalse()->end()
                ->scalarNode('force_chunking')
                    ->defaultFalse()->end()
                ->scalarNode('chunk_size')
                    ->info('Chunk size in bits')->defaultValue(1000000)->end()
                ->scalarNode('parallel_chunk_uploads')
                    ->defaultFalse()->end()
                ->scalarNode('retry_chunks')
                    ->defaultFalse()->end()
                ->scalarNode('retry_chunks_limit')
                    ->defaultValue(3)->end()
            ->end();


        return $treeBuilder;
    }
}
