import { useSiteInfoContext } from "@/contexts/siteInfoContext";
import { Box } from "@/styles/Box";
import { Flex } from "@/styles/Flex";
import { Loader } from "@/styles/Loader";
import { Heading } from "./heading";
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
    <Box
      $maxWidth="600px"
      $marginLeft="auto"
      $marginRight="auto"
      $marginTop="16"
    >
      <Heading size="lg" marginBottom="6">
        Admin settings
      </Heading>
      {construction == undefined ? (
        <Loader />
      ) : (
        <>
          <Flex
            $direction="column"
            $gap="4"
            $marginBottom="6"
            $alignItems="flex-start"
          >
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
          </Flex>
        </>
      )}
    </Box>
  );
};
