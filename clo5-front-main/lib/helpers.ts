const numberWithSpaces = (input: number) => {
  if (input || input === 0) {
    const parts = input.toString().split(".");
    const sign = parts[0].startsWith("-") ? "-" : "";
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    parts[0] = sign + parts[0].replace(/^-/, "");
    return parts.join(",");
  }
};

const checkType = (type: string, modelName?: string) => {
  const normalizedModelName = modelName?.toLowerCase();

  if (normalizedModelName === "pulse") {
    return "Coupe sport";
  }

  if (normalizedModelName === "volt") {
    return "Break";
  }

  switch (type) {
    case "HATCH":
      return "Compacte";
    case "SEDAN":
      return "Berline";
    case "SUV":
      return "SUV";
    default:
      return "Berline";
  }
};

function formatChoicePrice(item: any, choiceType?: "color") {
  let result = "";

  if (!choiceType && item.price === 0) {
    return "";
  }
  result = `${numberWithSpaces(item.price.toFixed(2))} \u20AC TTC`;

  return result;
}

export { checkType, formatChoicePrice, numberWithSpaces };
