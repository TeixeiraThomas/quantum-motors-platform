import { ButtonWithLink } from "@/components/ui/Buttons";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import ModelSpecs from "@/components/ui/ModelSpecs/ModelSpecs";
import SafeCarImage from "@/components/ui/SafeCarImage/SafeCarImage";
import { AnimatePresence, motion } from "framer-motion";
import { animEasingPrimary, mediaLG, mediaXL } from "lib/globalConstants";
import { checkType, numberWithSpaces } from "lib/helpers";
import { computeModelSpecs } from "lib/modelSpecs";
import { useTranslation } from "next-i18next";
import { Model } from "types/catalogTypes";
import styles from "./SelectedModel.module.scss";

type Props = {
  selectedModel: Model;
};

const SelectedModel = ({ selectedModel }: Props) => {
  const { t } = useTranslation(["common", "catalog"]);
  const mediaAboveLG = useMediaQuery(mediaLG);
  const mediaAboveXL = useMediaQuery(mediaXL);
  const selectedModelId = selectedModel?.id;
  const modelSpecs = computeModelSpecs({ model: selectedModel });

  return (
    <section className={`${styles["selected-model"]}`} data-vertical-layout={!mediaAboveLG}>
      <AnimatePresence mode="wait">
        <motion.figure
          key={selectedModel.image}
          className={`${styles["selected-model__image"]}`}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{
            duration: mediaAboveLG ? 0.35 : 0.42,
            ease: animEasingPrimary,
          }}
        >
          <SafeCarImage
            src={selectedModel?.image}
            alt={`${selectedModel.name} image`}
            width={980}
            height={654}
            priority
          />
        </motion.figure>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${selectedModel.name}-${selectedModel.price}`}
          className={`${styles["selected-model__content"]}`}
          initial={mediaAboveLG ? { opacity: 0, x: 16 } : { opacity: 0, y: 20 }}
          animate={mediaAboveLG ? { opacity: 1, x: 0 } : { opacity: 1, y: 0 }}
          exit={mediaAboveLG ? { opacity: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.35, ease: animEasingPrimary }}
        >
          <p className={`${styles["selected-model__eyebrow"]}`}>Quantum Signature Collection</p>
          <h1 className={`${styles["selected-model__title"]}`}>{selectedModel.name}</h1>

          <div className={`${styles["selected-model__meta"]}`}>
            <span className={`${styles["selected-model__price"]}`}>
              {t("common:starting-from")} {numberWithSpaces(selectedModel.price)} \u20AC TTC
            </span>
            <span className={`${styles["selected-model__type"]}`}>
              {checkType(selectedModel.type, selectedModel.name)}
            </span>
          </div>

          {selectedModel.description && mediaAboveXL ? (
            <div
              className={`${styles["selected-model__text"]}`}
              dangerouslySetInnerHTML={{
                __html: selectedModel.description,
              }}
            />
          ) : null}

          <ModelSpecs specs={modelSpecs} surface="dark" />

          {selectedModelId ? (
            <ButtonWithLink
              className={`${styles["selected-model__button"]}`}
              href={{
                pathname: "/configure",
                query: { model_id: selectedModelId },
              }}
            >
              {t("common:configure")}
            </ButtonWithLink>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

export default SelectedModel;
