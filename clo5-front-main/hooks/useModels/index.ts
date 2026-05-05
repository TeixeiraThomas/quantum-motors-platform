import { getApiBaseUrl } from "../../lib/api";
import { Models, Status } from "types/catalogTypes";

const fetchModels = async () => {
  // reset endpoint
  const data = await fetch(`${getApiBaseUrl()}/models`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).catch((error) => {
    console.error("Error fetching models", error);
  });

  if (!data) {
    return {
      status: Status.MODELS_NOT_FOUND,
      values: [],
    };
  }
  const response = await data.json();
  const values = Array.isArray(response)
    ? response
    : Array.isArray(response?.values)
    ? response.values
    : Array.isArray(response?.value)
    ? response.value
    : [];

  const datas: Models = {
    status: values.length > 0 ? Status.SUCCESS : Status.MODELS_NOT_FOUND,
    values: values,
  };

  return datas;
};

export { fetchModels };
