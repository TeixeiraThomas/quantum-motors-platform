import { ButtonWithoutLink } from "@/components/ui/Buttons";
import SafeCarImage from "@/components/ui/SafeCarImage/SafeCarImage";
import { checkType, numberWithSpaces } from "lib/helpers";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { Navigation } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Model } from "types/catalogTypes";
import styles from "./SliderModels.module.scss";

type Props = {
  models: Model[];
  selectedModel: Model;
  onModelSelect: (
    e: React.MouseEvent<HTMLElement>,
    modelId: string
  ) => void;
};

const SliderModels = ({ models, selectedModel, onModelSelect }: Props) => {
  const { t } = useTranslation(["common", "catalog"]);
  const router = useRouter();
  const safeModels = Array.isArray(models) ? models : [];

  return (
    <section className={`${styles["slider-models__section"]}`}>
      <header className={`${styles["slider-models__heading"]}`}>
        <p className={`${styles["slider-models__heading__eyebrow"]}`}>Gammes electriques</p>
        <h2 className={`${styles["slider-models__heading__title"]}`}>Choisir un modele</h2>
      </header>

      <Swiper
        spaceBetween={18}
        slidesPerView={"auto"}
        className={`${styles["slider-models"]}`}
        modules={[Navigation]}
        navigation
      >
        {safeModels.map((slide, index) => (
          <SwiperSlide
            key={slide?.id ?? index}
            className={`${styles["slider-models__card"]}`}
            data-is-selected={slide?.id === selectedModel?.id}
            onClick={(e: React.MouseEvent<HTMLElement>) =>
              slide?.id ? onModelSelect(e, slide.id) : null
            }
          >
            <header className={`${styles["slider-models__card__header"]}`}>
              <figure className={`${styles["slider-models__card__image"]}`}>
                <SafeCarImage
                  src={slide?.image}
                  alt={`${slide?.name || "model"} image`}
                  width={1024}
                  height={1024}
                />
              </figure>
            </header>

            <span className={`${styles["slider-models__card__type"]}`}>
              {checkType(slide?.type, slide?.name)}
            </span>

            <h3 className={`${styles["slider-models__card__title"]}`}>{slide?.name}</h3>

            <p className={`${styles["slider-models__card__description"]}`}>
              {t("common:starting-from")} {numberWithSpaces(slide?.price ?? 0)} \u20AC TTC
            </p>

            <ButtonWithoutLink
              className={`${styles["slider-models__card__button"]}`}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                if (!slide?.id) {
                  return;
                }

                router.push({
                  pathname: "/configure",
                  query: { model_id: slide.id },
                });
              }}
            >
              {t("common:configure")}
            </ButtonWithoutLink>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default SliderModels;
