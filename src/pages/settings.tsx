import { AdminSettings } from "@/components/adminSettings";
import { Button } from "@/components/button";
import exportToCsv from "@/components/exportToCSV";
import { Heading } from "@/components/heading";
import { Modal } from "@/components/modal";
import { Paragraph } from "@/components/paragraph";
import { TextInput } from "@/components/textInput";
import { Toggle } from "@/components/toggle";
import { useSeenContext } from "@/contexts/seenContext";
import { useSnackbarContext } from "@/contexts/snackbarContext";
import { fetchMovies } from "@/functions/fetchMovies";
import { useAuth, emailChange, userDeletion } from "@/hooks/useAuth";
import { Box } from "@/styles/Box";
import { Flex } from "@/styles/Flex";
import { Loader } from "@/styles/Loader";
import { MoviesYearsListType } from "@/types";
import { validateEmail, validateUsername } from "@/utils";
import { GetStaticProps, InferGetStaticPropsType } from "next";
import { useRouter } from "next/router";
import { useContext, useState, useEffect } from "react";
import { supabase } from "@/supabase";
import styled from "styled-components";

const SettingsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
`;

const LogoutLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 0;
  border: 0;
  background: none;
  color: var(--color-secondary-500);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    color: var(--color-secondary-700);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const DangerAccordion = styled.details`
  margin: 112px 0 32px;
  padding-top: 48px;
  border-top: 1px solid var(--color-neutral-300);

  summary {
    width: fit-content;
    color: var(--color-ui-red, #b42318);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }

  button {
    margin-top: 12px;
  }
`;

type ButtonLoadingType = "email" | "password" | "username" | "delete";

export const getStaticProps = (async () => {
  const movies = await fetchMovies();
  return {
    props: {
      movies: [...movies].reverse(),
    },
  };
}) satisfies GetStaticProps<{
  movies: MoviesYearsListType;
}>;

export default function Settings({
  movies,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const { userId, isAdmin } = useAuth();
  const {
    seenMovies,
    refreshSeenMovies,
    userSettings,
    changeUserName,
    changeShowInLeaderboard,
    toggleShowSeenDates,
    togglePercentageByWatchTime,
    changeMovieLinkDestination,
  } = useSeenContext();
  const router = useRouter();
  const [showInLeaderboard, setShowInLeaderboard] = useState<boolean>();
  const [percentageByWatchTime, setPercentageByWatchTime] = useState<boolean>();
  const [username, setUsername] = useState<string>();
  const [loading, setLoading] = useState<ButtonLoadingType>();
  const [newEmail, setNewEmail] = useState<string>("");
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [imdbFile, setImdbFile] = useState<File>();
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const { showSnackbar } = useSnackbarContext();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  useEffect(() => {
    if (!username) {
      setUsername(userSettings?.username);
    }

    if (showInLeaderboard === undefined) {
      setShowInLeaderboard(
        userSettings.showInLeaderboard !== undefined
          ? userSettings.showInLeaderboard
          : true
      );
    }

    if (percentageByWatchTime === undefined) {
      setPercentageByWatchTime(
        userSettings.percentageByWatchTime !== undefined
          ? userSettings.percentageByWatchTime
          : false
      );
    }
  }, [
    userSettings,
    username,
    showInLeaderboard,
    percentageByWatchTime,
  ]);

  const updateUsername = async () => {
    setLoading("username");

    if (!username || username === userSettings?.username || !userId) {
      setLoading(undefined);
      return;
    }
    const usernameError = validateUsername(username.trim());
    if (usernameError) {
      showSnackbar(usernameError, "error");
      setLoading(undefined);
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ username: username.trim() })
      .eq("id", userId);
    if (error) {
      showSnackbar(
        error.code === "23505" ? "That username is already taken" : error.message,
        "error"
      );
    } else {
      changeUserName(username.trim());
      showSnackbar("Username was successfully changed", "success");
    }
    setLoading(undefined);
  };

  const changeEmail = async () => {
    setLoading("email");

    const emailError = validateEmail(newEmail);
    if (emailError) {
      showSnackbar(emailError, "error");
      setLoading(undefined);
    } else {
      try {
        await emailChange(newEmail.trim());
        await supabase.auth.signOut();
        showSnackbar(
          "A verification email has been sent to your new email",
          "success"
        );
        router.push("/login");
      } catch (error: any) {
        showSnackbar(error.message, "error");
      } finally {
        setLoading(undefined);
      }
    }
  };

  const deleteAccount = () => {
    setLoading("delete");

    userDeletion()
      .then(() => {
        showSnackbar("Account was successfully deleted", "success");
        setDeleteModal(false);
        router.push("/");
      })
      .catch((error) => {
        showSnackbar(error.message, "error");
        setLoading(undefined);
      });
  };

  const deleteUserData = deleteAccount;

  const handleExport = () => {
    exportToCsv(seenMovies, movies, "seen_movies");
  };

  const importImdbRatings = async () => {
    if (!imdbFile) return;
    if (imdbFile.size > 5 * 1024 * 1024) {
      setImportStatus("Please choose a CSV file smaller than 5 MB.");
      return;
    }
    setIsImporting(true);
    setImportStatus("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in again to import your ratings.");
      const response = await fetch("/api/import/imdb-ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ csv: await imdbFile.text() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not import IMDb ratings.");
      await refreshSeenMovies();
      setImportStatus(
        `Imported ${result.imported} new movies. ${result.alreadySeen} were already marked seen and left unchanged; ${result.unmatched} were not in the catalog.`
      );
      setImdbFile(undefined);
    } catch (error) {
      setImportStatus(error instanceof Error ? error.message : "Could not import IMDb ratings.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Box $maxWidth="600px" $marginLeft="auto" $marginRight="auto">
      <SettingsHeader>
        <Heading size="lg">Settings</Heading>
        {userId && (
          <LogoutLink type="button" onClick={handleSignOut}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10 17l5-5-5-5" />
              <path d="M15 12H3" />
              <path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" />
            </svg>
            Log out
          </LogoutLink>
        )}
      </SettingsHeader>
      {!userId || !userSettings ? (
        <Loader />
      ) : (
        <>
          <Flex $alignItems="flex-end" $gap="sm" $marginBottom="lg">
            <TextInput
              label="Username"
              value={username ?? ""}
              setValue={(value) => setUsername(value)}
            />
            <Button
              onClick={updateUsername}
              label="Save"
              isLoading={loading === "username"}
            />
          </Flex>
          <Flex $alignItems="flex-end" $gap="sm" $marginBottom="lg">
            <TextInput
              label="Change email"
              value={newEmail ?? ""}
              setValue={(value) => setNewEmail(value)}
            />
            <Button
              onClick={changeEmail}
              label="Save"
              isLoading={loading === "email"}
            />
          </Flex>
          <Flex
            $direction="column"
            $gap="md"
            $marginBottom="lg"
            $alignItems="flex-start"
          >
            <Toggle
              label="Hide seen dates in the movie list"
              value={userSettings.hideSeenDates ?? false}
              onToggle={toggleShowSeenDates}
              size="sm"
            />
            <Toggle
              label="Show your user in the leaderboard"
              value={showInLeaderboard ?? true}
              onToggle={() => {
                setShowInLeaderboard((prev) => !prev);
                changeShowInLeaderboard();
              }}
              size="sm"
            />
            <Toggle
              label="Progress by watchtime instead of movie count"
              value={percentageByWatchTime ?? false}
              onToggle={() => {
                setPercentageByWatchTime((prev) => !prev);
                togglePercentageByWatchTime();
              }}
              size="sm"
            />
          </Flex>
          <Box $marginTop="xxl" $marginBottom="lg">
            <Heading size="md" marginBottom="sm">
              Movie links
            </Heading>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend>Open movies with:</legend>
              {([
                ["imdb", "IMDb"],
                ["letterboxd", "Letterboxd"],
                ["simkl", "Simkl"],
              ] as const).map(([value, label]) => (
                <label key={value} style={{ display: "block", marginTop: 8 }}>
                  <input
                    type="radio"
                    name="movie-link-destination"
                    value={value}
                    checked={(userSettings.movieLinkDestination ?? "imdb") === value}
                    onChange={() => changeMovieLinkDestination(value)}
                  />{" "}{label}
                </label>
              ))}
            </fieldset>
          </Box>
          <Box $marginTop="xxxl" $marginBottom="lg">
            <Heading size="lg" marginBottom="md">
              Export your data
            </Heading>
            <Button
              type="button"
              onClick={handleExport}
              label="Export"
              variant="secondary"
            />
          </Box>

          <Box $marginTop="xxl" $marginBottom="lg">
            <Heading size="lg" marginBottom="sm">
              Import IMDb ratings
            </Heading>
            <Paragraph marginBottom="sm">
              Upload your IMDb ratings CSV. Movies in this catalog will be marked as seen using their IMDb rating date.
            </Paragraph>
            <Flex $direction="column" $gap="sm" $alignItems="flex-start">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  setImdbFile(event.currentTarget.files?.[0]);
                  setImportStatus("");
                }}
                aria-label="Choose IMDb ratings CSV"
              />
              <Button
                type="button"
                onClick={importImdbRatings}
                label="Import ratings"
                isLoading={isImporting}
                disabled={!imdbFile || isImporting}
              />
              {importStatus && <Paragraph>{importStatus}</Paragraph>}
            </Flex>
          </Box>

        </>
      )}

      {isAdmin && <AdminSettings />}

      {userId && userSettings && (
        <DangerAccordion>
          <summary>Danger zone</summary>
          <Button
            type="button"
            onClick={() => setDeleteModal(true)}
            label="Delete account"
            variant="danger"
          />
        </DangerAccordion>
      )}

      {deleteModal && (
        <Modal
          isOpen={deleteModal}
          onClose={() => setDeleteModal(false)}
          maxWidth="400px"
        >
          <Flex $direction="column" $gap="sm">
            <Heading size="lg">Delete account</Heading>
            <Paragraph marginBottom="md" textAlign="center">
              Are you sure you want to delete your account? This action is
              irreversible.
            </Paragraph>
            <Box>
              <Button
                onClick={deleteUserData}
                label="Delete account"
                variant="danger"
                isLoading={loading === "delete"}
              />
            </Box>
          </Flex>
        </Modal>
      )}
    </Box>
  );
}
