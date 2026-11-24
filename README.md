Installation
============

### Get the bundle using composer

Add GlavwebDropzoneBundle by running this command from the terminal at the root of
your Symfony project:

```bash
php composer.phar require glavweb/uploader-dropzone-bundle
```


### Enable the bundle

To start using the bundle, register the bundle in your application's kernel class:

```php
// app/AppKernel.php
public function registerBundles()
{
    $bundles = array(
        // ...
        new Glavweb\UploaderDropzoneBundle\GlavwebUploaderDropzoneBundle(),
        // ...
    );
}
```

To add resources to a twig configuration.

```
twig:
    ...
    form_themes:
        - '@GlavwebUploaderDropzone/Form/fields.html.twig'

```

To add resources to a twig layout 

```

{% block javascripts %}

    ...

        <script src="{{ asset('bundles/glavwebuploaderdropzone/uploader.js') }}"></script>

    ...
    
{% endblock %}
 
 
{% block stylesheets %}

    ...
    
    <link href="{{ asset('bundles/glavwebuploaderdropzone/uploader.css') }}" rel="stylesheet">
    
    ...
    
{% endblock %}

```

### Execute "assets:install".

```
php app/console assets:install
```

for Symfony3:

```
php bin/console assets:install
```

### Basic Usage.

You can create form, as this:

```
use Glavweb\UploaderDropzoneBundle\Form\ImageCollectionType;
use Glavweb\UploaderDropzoneBundle\Form\ImageType;
use Glavweb\UploaderDropzoneBundle\Form\VideoCollectionType;
use Glavweb\UploaderDropzoneBundle\Form\VideoType;

$form = $this->createFormBuilder($product)
    ->add('name', null, ['label' => 'name'])

    ->add('titleImage', ImageType::class, [
        'label'            => 'Image',
        'context'          => 'image',
        'thumbnail_filter' => 'image'
    ])

    ->add('imageGalleryItems', ImageCollectionType::class, [
        'label'            => 'Image Gallery',
        'context'          => 'image_gallery',
        'thumbnail_filter' => 'image_gallery'
    ])

    ->add('titleVideo', VideoType::class, [
        'label'            => 'Video',
        'context'          => 'video',
        'thumbnail_filter' => 'video'
    ])

    ->add('videoGalleryItems', VideoCollectionType::class, [
        'label'            => 'Video Gallery',
        'context'          => 'video',
        'thumbnail_filter' => 'video_gallery'
    ])
->getForm();
```