import { ModelType } from "types/catalogTypes";

type ModelLike = {
  id?: string | number;
  name?: string;
  type?: string;
};

type ConfigBattery = {
  capacity?: number;
  power?: number;
  state?: {
    selected?: boolean;
  };
};

type ConfigFinish = {
  name?: string;
  state?: {
    selected?: boolean;
  };
};

export type ModelSpecs = {
  rangeKm: number;
  topSpeedKmh: number;
  zeroToHundredSec: number;
  weightKg: number;
};

const STANDARD_CAPACITY_KWH = 58;
const STANDARD_POWER_KW = 180;

const BASE_SPECS_BY_MODEL: Record<string, ModelSpecs> = {
  electron: { rangeKm: 552, topSpeedKmh: 214, zeroToHundredSec: 6.4, weightKg: 2140 },
  volt: { rangeKm: 624, topSpeedKmh: 192, zeroToHundredSec: 7.6, weightKg: 1845 },
  spark: { rangeKm: 418, topSpeedKmh: 168, zeroToHundredSec: 9.4, weightKg: 1280 },
  pulse: { rangeKm: 534, topSpeedKmh: 276, zeroToHundredSec: 3.4, weightKg: 1815 },
  zenith: { rangeKm: 648, topSpeedKmh: 206, zeroToHundredSec: 6.7, weightKg: 1775 },
};

const BASE_SPECS_BY_TYPE: Record<ModelType, ModelSpecs> = {
  [ModelType.SUV]: {
    rangeKm: 548,
    topSpeedKmh: 205,
    zeroToHundredSec: 6.9,
    weightKg: 2050,
  },
  [ModelType.SEDAN]: {
    rangeKm: 612,
    topSpeedKmh: 208,
    zeroToHundredSec: 6.5,
    weightKg: 1760,
  },
  [ModelType.HATCH]: {
    rangeKm: 430,
    topSpeedKmh: 172,
    zeroToHundredSec: 8.8,
    weightKg: 1310,
  },
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getSelectedBattery = (batteries: ConfigBattery[] = []) =>
  batteries.find((battery) => battery?.state?.selected);

const getSelectedFinish = (finishes: ConfigFinish[] = []) =>
  finishes.find((finish) => finish?.state?.selected);

const getBaseSpecs = (model?: ModelLike): ModelSpecs => {
  const modelName = model?.name?.toLowerCase().trim();

  if (modelName && BASE_SPECS_BY_MODEL[modelName]) {
    return BASE_SPECS_BY_MODEL[modelName];
  }

  if (model?.type && model.type in BASE_SPECS_BY_TYPE) {
    return BASE_SPECS_BY_TYPE[model.type as ModelType];
  }

  return BASE_SPECS_BY_TYPE[ModelType.SEDAN];
};

const getFinishDeltas = (finish?: ConfigFinish) => {
  const name = finish?.name?.toLowerCase() || "";

  if (name.includes("eco")) {
    return { rangeKm: 24, topSpeedKmh: -6, zeroToHundredSec: 0.5, weightKg: -20 };
  }

  if (name.includes("sport")) {
    return { rangeKm: -20, topSpeedKmh: 14, zeroToHundredSec: -0.6, weightKg: 24 };
  }

  if (name.includes("ultra")) {
    return { rangeKm: 15, topSpeedKmh: 5, zeroToHundredSec: -0.2, weightKg: 38 };
  }

  if (name.includes("confort")) {
    return { rangeKm: 9, topSpeedKmh: 0, zeroToHundredSec: 0.1, weightKg: 12 };
  }

  return { rangeKm: 0, topSpeedKmh: 0, zeroToHundredSec: 0, weightKg: 0 };
};

export const computeModelSpecs = ({
  model,
  batteries = [],
  finishes = [],
}: {
  model?: ModelLike;
  batteries?: ConfigBattery[];
  finishes?: ConfigFinish[];
}): ModelSpecs => {
  const base = getBaseSpecs(model);
  const selectedBattery = getSelectedBattery(batteries);
  const selectedFinish = getSelectedFinish(finishes);
  const finishDeltas = getFinishDeltas(selectedFinish);

  const capacityDelta = (selectedBattery?.capacity ?? STANDARD_CAPACITY_KWH) - STANDARD_CAPACITY_KWH;
  const powerDelta = (selectedBattery?.power ?? STANDARD_POWER_KW) - STANDARD_POWER_KW;

  const rangeKm = Math.round(base.rangeKm + capacityDelta * 4.6 + finishDeltas.rangeKm);
  const topSpeedKmh = Math.round(
    base.topSpeedKmh + powerDelta * 0.12 + finishDeltas.topSpeedKmh
  );
  const zeroToHundredSec = Math.round(
    (base.zeroToHundredSec - powerDelta * 0.01 + finishDeltas.zeroToHundredSec) * 10
  ) / 10;
  const weightKg = Math.round(base.weightKg + capacityDelta * 5 + finishDeltas.weightKg);

  return {
    rangeKm: clamp(rangeKm, 280, 950),
    topSpeedKmh: clamp(topSpeedKmh, 140, 330),
    zeroToHundredSec: clamp(zeroToHundredSec, 2.6, 13.5),
    weightKg: clamp(weightKg, 1050, 3400),
  };
};

export const formatZeroToHundred = (value: number) =>
  `${value.toFixed(1).replace(".", ",")}s`;
