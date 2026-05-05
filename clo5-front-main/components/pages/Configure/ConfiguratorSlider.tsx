import { useHasHydrated } from "@/hooks/useHasHydrated";
import SafeCarImage from "@/components/ui/SafeCarImage/SafeCarImage";
import * as Tabs from "@radix-ui/react-tabs";
import { motion } from "framer-motion";
import { animEasingPrimary } from "lib/globalConstants";
import { rgbDataURL } from "lib/placeholder";
import Image from "next/image";
import { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { Navigation } from "swiper";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import styles from "./ConfiguratorSlider.module.scss";

type ImageCollection = string[] | Record<string, string>;

type Props = {
  image?: string;
  modelImage?: string | string[];
  images?: {
    outside?: ImageCollection;
    inside?: ImageCollection;
    [key: string]: unknown;
  };
  color: string;
  isLoading: boolean;
  activeTab: string;
  setActiveTab: (data: string) => void;
  activeSlideIndex: number;
};

type Slide = {
  key: string;
  label: string;
  src: string;
};

const withAlternateLocalHost = (url?: string) => {
  if (!url) {
    return [];
  }

  if (url.includes("localhost")) {
    return [url, url.replace("localhost", "127.0.0.1")];
  }

  if (url.includes("127.0.0.1")) {
    return [url, url.replace("127.0.0.1", "localhost")];
  }

  return [url];
};

const normalizeSlides = (source?: ImageCollection, fallbackLabel?: string): Slide[] => {
  if (!source) {
    return [];
  }

  if (Array.isArray(source)) {
    return source
      .filter((item) => typeof item === "string" && item.length > 0)
      .map((item, index) => ({
        key: `${fallbackLabel || "view"}-${index}`,
        label: `${fallbackLabel || "Vue"} ${index + 1}`,
        src: item,
      }));
  }

  return Object.entries(source)
    .filter(([, value]) => typeof value === "string" && value.length > 0)
    .map(([key, value], index) => ({
      key,
      label: key.replace(/[-_]/g, " ") || `${fallbackLabel || "Vue"} ${index + 1}`,
      src: value,
    }));
};

const ConfiguratorSlider = ({
  image,
  modelImage,
  images,
  color,
  isLoading,
  activeTab,
  setActiveTab,
  activeSlideIndex,
}: Props) => {
  const hasHydrated = useHasHydrated();
  const [swiperInstance, setSwiperInstance] = useState<SwiperType>();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const fallbackImageCandidates = useMemo(() => {
    const imageCandidates = withAlternateLocalHost(image);

    if (Array.isArray(modelImage)) {
      return [...imageCandidates, ...modelImage];
    }

    if (modelImage) {
      return [...imageCandidates, modelImage];
    }

    return imageCandidates.length > 0
      ? imageCandidates
      : "/images/default-car.jpeg";
  }, [image, modelImage]);

  const outsideSlides = useMemo(() => {
    const directOutside = normalizeSlides(images?.outside, "Exterieur");

    if (directOutside.length > 0) {
      return directOutside;
    }

    const legacyOutside = normalizeSlides(
      images && !images?.outside && !images?.inside
        ? (images as ImageCollection)
        : undefined,
      "Exterieur"
    );

    if (legacyOutside.length > 0) {
      return legacyOutside;
    }

    return [
      {
        key: "outside-main",
        label: "Exterieur 1",
        src: Array.isArray(fallbackImageCandidates)
          ? fallbackImageCandidates[0] || "/images/default-car.jpeg"
          : fallbackImageCandidates,
      },
    ];
  }, [fallbackImageCandidates, images]);

  const insideSlides = useMemo(
    () => normalizeSlides(images?.inside, "Interieur"),
    [images?.inside]
  );

  const hasInsideView = insideSlides.length > 0;
  const visibleSlides = activeTab === "inside" && hasInsideView ? insideSlides : outsideSlides;

  useEffect(() => {
    if (!hasInsideView && activeTab === "inside") {
      setActiveTab("outside");
    }
  }, [activeTab, hasInsideView, setActiveTab]);

  useEffect(() => {
    if (!swiperInstance) {
      return;
    }

    const nextIndex = Math.min(activeSlideIndex, Math.max(visibleSlides.length - 1, 0));
    swiperInstance.slideTo(nextIndex);
    setCurrentSlideIndex(nextIndex);
  }, [activeSlideIndex, swiperInstance, visibleSlides.length]);

  useEffect(() => {
    if (swiperInstance) {
      swiperInstance.slideTo(0);
      setCurrentSlideIndex(0);
    }
  }, [activeTab, swiperInstance]);

  return (
    <>
      {hasHydrated && (
        <motion.div
          className={`${styles["configurator-slider"]}`}
          style={
            {
              "--accent-color": color,
            } as CSSProperties
          }
          initial={{ y: 32, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, ease: animEasingPrimary }}
        >
          <Tabs.Root
            className="app-tab"
            value={activeTab}
            onValueChange={(value) => setActiveTab(value)}
          >
            <Tabs.List className="app-tabs__tab-list" aria-label="Switch view">
              <Tabs.Trigger className="app-tabs__trigger" value="outside">
                Exterieur
              </Tabs.Trigger>
              {hasInsideView ? (
                <Tabs.Trigger className="app-tabs__trigger" value="inside">
                  Interieur
                </Tabs.Trigger>
              ) : null}
            </Tabs.List>

            <Tabs.Content className="app-tabs" value="outside">
              <Swiper
                spaceBetween={12}
                slidesPerView={1}
                modules={[Navigation]}
                navigation={!isLoading && visibleSlides.length > 1}
                onSwiper={setSwiperInstance}
                onSlideChange={(swiper) => {
                  setCurrentSlideIndex(swiper.activeIndex);
                }}
                className={`${styles["configurator-slider__slider"]}`}
              >
                {isLoading ? (
                  <Image
                    className={`${styles["configurator-slider__loader"]}`}
                    src="/svg/loader.svg"
                    alt="Loading"
                    width={80}
                    height={80}
                  />
                ) : (
                  visibleSlides.map((slide) => (
                    <SwiperSlide
                      key={slide.key}
                      className={`${styles["configurator-slider__slider__slide"]}`}
                    >
                      <figure className={`${styles["configurator-slider__img"]}`}>
                        <SafeCarImage
                          src={slide.src || fallbackImageCandidates}
                          width={1200}
                          height={675}
                          alt={`${slide.label} du vehicule`}
                          placeholder="blur"
                          blurDataURL={rgbDataURL(245, 245, 245)}
                        />
                      </figure>
                    </SwiperSlide>
                  ))
                )}
              </Swiper>

              {!isLoading && visibleSlides.length > 1 ? (
                <div className={`${styles["configurator-slider__angles"]}`}>
                  {visibleSlides.map((slide, index) => (
                    <button
                      key={slide.key}
                      type="button"
                      className={`${styles["configurator-slider__angles__button"]}`}
                      data-active={index === currentSlideIndex}
                      onClick={() => {
                        swiperInstance?.slideTo(index);
                      }}
                    >
                      <span className={`${styles["configurator-slider__angles__thumb"]}`}>
                        <SafeCarImage
                          src={slide.src || fallbackImageCandidates}
                          alt={slide.label}
                          width={120}
                          height={68}
                        />
                      </span>
                      <span>{slide.label}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </Tabs.Content>

            {hasInsideView ? (
              <Tabs.Content className="app-tabs" value="inside">
                <Swiper
                  spaceBetween={12}
                  slidesPerView={1}
                  modules={[Navigation]}
                  navigation={!isLoading && visibleSlides.length > 1}
                  onSwiper={setSwiperInstance}
                  onSlideChange={(swiper) => {
                    setCurrentSlideIndex(swiper.activeIndex);
                  }}
                  className={`${styles["configurator-slider__slider"]}`}
                >
                  {visibleSlides.map((slide) => (
                    <SwiperSlide
                      key={slide.key}
                      className={`${styles["configurator-slider__slider__slide"]}`}
                    >
                      <figure className={`${styles["configurator-slider__img"]}`}>
                        <SafeCarImage
                          src={slide.src || fallbackImageCandidates}
                          width={1200}
                          height={675}
                          alt={`${slide.label} du vehicule`}
                          placeholder="blur"
                          blurDataURL={rgbDataURL(245, 245, 245)}
                        />
                      </figure>
                    </SwiperSlide>
                  ))}
                </Swiper>

                {!isLoading && visibleSlides.length > 1 ? (
                  <div className={`${styles["configurator-slider__angles"]}`}>
                    {visibleSlides.map((slide, index) => (
                      <button
                        key={slide.key}
                        type="button"
                        className={`${styles["configurator-slider__angles__button"]}`}
                        data-active={index === currentSlideIndex}
                        onClick={() => {
                          swiperInstance?.slideTo(index);
                        }}
                      >
                        <span className={`${styles["configurator-slider__angles__thumb"]}`}>
                          <SafeCarImage
                            src={slide.src || fallbackImageCandidates}
                            alt={slide.label}
                            width={120}
                            height={68}
                          />
                        </span>
                        <span>{slide.label}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </Tabs.Content>
            ) : null}
          </Tabs.Root>
        </motion.div>
      )}
    </>
  );
};

export default ConfiguratorSlider;
