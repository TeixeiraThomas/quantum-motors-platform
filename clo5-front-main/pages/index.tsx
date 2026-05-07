import HeadCustom from "@/components/global/Head/Head";
import LayoutHome from "@/components/global/LayoutHome/LayoutHome";
import SelectedModel from "@/components/pages/Home/SelectedModel";
import SliderModels from "@/components/pages/Home/SliderModels";
import { fetchModels } from "hooks";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ReactElement, useEffect, useMemo, useState } from "react";
import { Model } from "types/catalogTypes";

export function Homepage({ modelsData }: { modelsData: any }) {
  const models = useMemo(
    () => (Array.isArray(modelsData) ? modelsData : []),
    [modelsData]
  );

  const [selectedModel, setSelectedModel] = useState<Model | null>(() => {
    return models[0] ?? null;
  });

  function setActiveModel(
    _e: React.MouseEvent<HTMLElement>,
    modelId: string | number
  ) {
    const selectedModelIndex = models.findIndex(
      (element: Model) => element.id === modelId
    );

    if (selectedModelIndex >= 0) {
      setSelectedModel(models[selectedModelIndex]);
    }
  }

  useEffect(() => {
    setSelectedModel(models[0] ?? null);
  }, [models, setSelectedModel]);

  if (models.length === 0) {
    return (
      <section className="flex flex--col justify-content--center align-items--center text--center">
        <h1>Catalogue temporairement indisponible</h1>
        <p>
          Les donnees modeles ne sont pas chargees. Verifie que l API backend
          est disponible, puis recharge la page.
        </p>
      </section>
    );
  }

  return (
    <>
      {selectedModel ? (
        <>
          <SelectedModel selectedModel={selectedModel} />
          <SliderModels
            selectedModel={selectedModel}
            models={models}
            onModelSelect={setActiveModel}
          />
        </>
      ) : null}
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const models = await fetchModels();
  return {
    props: {
      ...(await serverSideTranslations(context.locale as string, [
        "common",
        "catalog",
      ])),
      modelsData: models.values,
    },
  };
};

Homepage.getLayout = function getLayout(page: ReactElement) {
  return (
    <LayoutHome>
      <HeadCustom />
      {page}
    </LayoutHome>
  );
};

export default Homepage;
