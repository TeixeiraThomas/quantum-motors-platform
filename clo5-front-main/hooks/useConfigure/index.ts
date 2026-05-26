import { getApiBaseUrl } from "../../lib/api";
import { useQuery } from "@tanstack/react-query";
import { ChoicesConfiguration, Status } from "types/catalogTypes";

type queryParams = {
  choices?: ChoicesConfiguration | {};
  code: string;
};

type ConfigurePayload = {
  model: number;
  finish?: number;
  battery?: number;
  color?: number;
};

const toNumericId = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const fetchConfigure = async ({ code, choices }: queryParams) => {
  const model = toNumericId(code);
  if (!model) {
    return {
      status: Status.MODEL_NOT_FOUND,
      value: [],
    };
  }

  const selectedChoices = (choices as ChoicesConfiguration) || {};
  const payload: ConfigurePayload = { model };
  const finish = toNumericId(selectedChoices.finish);
  const battery = toNumericId(selectedChoices.battery);
  const color = toNumericId(selectedChoices.color);

  if (finish !== undefined) {
    payload.finish = finish;
  }

  if (battery !== undefined) {
    payload.battery = battery;
  }

  if (color !== undefined) {
    payload.color = color;
  }

  const data = await fetch(`${getApiBaseUrl()}/car/configure`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).catch((error) => {
    console.error("Error fetching models", error);
  });

  if (!data) {
    return {
      status: Status.MODELS_NOT_FOUND,
      value: [],
    };
  }
  const response = await data.json();

  if (response.code !== 200) {
    return {
      status: Status.MODEL_NOT_FOUND,
      value: [],
    };
  }

  return {
    status: Status.SUCCESS,
    value: response.value,
  };
};

const useConfigure = ({ code, choices }: queryParams) => {
  return useQuery({
    queryKey: ["configure", { code, choices }],
    queryFn: () => fetchConfigure({ code, choices }),
    refetchOnWindowFocus: false,
    enabled: Boolean(code),
  });
};

export { fetchConfigure, useConfigure };
