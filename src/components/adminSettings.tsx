import { useSiteInfoContext } from "@/contexts/siteInfoContext";
import { Loader } from "@/styles/Loader";
import { Toggle } from "./toggle";

export const AdminSettings = () => {
  const {
    predictions,
    construction,
    moviesBeingAdded,
    toggleConstruction,
    toggleMoviesBeingAdded,
    togglePredictions,
  } = useSiteInfoContext();

  return (
    <div className="mt-16 ml-auto mr-auto max-w-xl">
      <h2 className="heading text-2xl !mb-6">
        Admin settings
      </h2>
      {construction == undefined ? (
        <Loader />
      ) : (
        <>
          <div className="flex flex-col justify-between items-start gap-4 mb-6">
            <Toggle
              label="Under construction"
              value={construction ?? false}
              onToggle={toggleConstruction}
            />

            <Toggle
              label="Predictions"
              value={predictions ?? false}
              onToggle={togglePredictions}
            />

            <Toggle
              label="Movies being added"
              value={moviesBeingAdded ?? false}
              onToggle={toggleMoviesBeingAdded}
            />
          </div>
        </>
      )}
    </div>
  );
};
