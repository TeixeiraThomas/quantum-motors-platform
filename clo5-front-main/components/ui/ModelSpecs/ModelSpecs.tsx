import { formatZeroToHundred, ModelSpecs as ModelSpecsType } from "lib/modelSpecs";
import styles from "./ModelSpecs.module.scss";

type Props = {
  specs: ModelSpecsType;
  surface?: "dark" | "light";
};

const ModelSpecs = ({ specs, surface = "dark" }: Props) => {
  return (
    <ul className={`${styles["model-specs"]}`} data-surface={surface}>
      <li className={`${styles["model-specs__item"]}`}>
        <span className={`${styles["model-specs__value"]}`}>{specs.rangeKm}km</span>
        <span className={`${styles["model-specs__label"]}`}>
          Autonomie
          <br />
          (WLTP)
        </span>
      </li>

      <li className={`${styles["model-specs__item"]}`}>
        <span className={`${styles["model-specs__value"]}`}>{specs.topSpeedKmh}km/h</span>
        <span className={`${styles["model-specs__label"]}`}>Vitesse maximale</span>
      </li>

      <li className={`${styles["model-specs__item"]}`}>
        <span className={`${styles["model-specs__value"]}`}>
          {formatZeroToHundred(specs.zeroToHundredSec)}
        </span>
        <span className={`${styles["model-specs__label"]}`}>0 a 100 km/h</span>
      </li>

      <li className={`${styles["model-specs__item"]}`}>
        <span className={`${styles["model-specs__value"]}`}>{specs.weightKg}kg</span>
        <span className={`${styles["model-specs__label"]}`}>Poids</span>
      </li>
    </ul>
  );
};

export default ModelSpecs;
