import Image, { ImageProps } from "next/image";
import { useEffect, useMemo, useState } from "react";

const FALLBACK_IMAGE_SRC = "/images/default-car.jpeg";

const isAllowedImageSrc = (value?: string) => {
  if (!value) {
    return false;
  }

  const src = value.trim();
  return (
    src.startsWith("/") ||
    src.startsWith("http://") ||
    src.startsWith("https://")
  );
};

const getSafeImageSrc = (value?: string) =>
  isAllowedImageSrc(value) ? value!.trim() : FALLBACK_IMAGE_SRC;

type Props = Omit<ImageProps, "src" | "alt"> & {
  src?: string | string[];
  alt: string;
};

const SafeCarImage = ({ src, alt, onError, ...props }: Props) => {
  const srcCandidates = useMemo(() => {
    const values = Array.isArray(src) ? src : [src];
    const normalized = values
      .map((value) => getSafeImageSrc(value))
      .filter((value, index, self) => self.indexOf(value) === index);

    if (!normalized.includes(FALLBACK_IMAGE_SRC)) {
      normalized.push(FALLBACK_IMAGE_SRC);
    }

    return normalized;
  }, [src]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const imageSrc = srcCandidates[candidateIndex] || FALLBACK_IMAGE_SRC;

  useEffect(() => {
    setCandidateIndex(0);
  }, [srcCandidates]);

  return (
    <Image
      {...props}
      alt={alt}
      src={imageSrc}
      onError={(event) => {
        if (candidateIndex < srcCandidates.length - 1) {
          setCandidateIndex((index) => index + 1);
        }

        onError?.(event);
      }}
    />
  );
};

export default SafeCarImage;
