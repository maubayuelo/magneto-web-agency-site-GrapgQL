import Image from 'next/image';

type WpImageSize = {
  name: string;
  sourceUrl: string;
  width: number;
};

type Props = {
  image: {
    altText?: string;
    sourceUrl: string;
    mediaDetails?: {
      sizes?: WpImageSize[];
    };
  };
  width?: number;
  height?: number;
  className?: string;
};

export default function WpResponsiveImage({
  image,
  width = 1024,
  height = 600,
  className,
}: Props) {
  const sizes = image?.mediaDetails?.sizes || [];
  const getSizeUrl = (name: string) =>
    sizes.find((s) => s.name === name)?.sourceUrl;

  const srcSet = [
    getSizeUrl('medium') && `${getSizeUrl('medium')} 300w`,
    getSizeUrl('large') && `${getSizeUrl('large')} 1024w`,
    (getSizeUrl('full') || image.sourceUrl) + ' 1920w',
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Image
      className={className}
      src={getSizeUrl('large') || image.sourceUrl}
      alt={image.altText || ''}
      width={width}
      height={height}
      srcSet={srcSet}
      sizes="(max-width: 600px) 300px, (max-width: 1200px) 1024px, 1920px"
      style={{ width: '100%', height: 'auto' }}
    />
  );
}