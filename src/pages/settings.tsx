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

const ImportTabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--color-neutral-300);
`;

const ImportTab = styled.button<{ $active: boolean }>`
  padding: 8px 12px;
  border: 0;
  border-bottom: 2px solid ${({ $active }) => $active ? "var(--color-primary-500)" : "transparent"};
  background: transparent;
  color: ${({ $active }) => $active ? "var(--color-primary-700)" : "inherit"};
  font: inherit;
  font-weight: 600;
  cursor: pointer;
`;

const ImportInstructions = styled.div`
  margin: 0 0 16px;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.5;

  p { margin: 0; }

  a {
    color: var(--color-primary-700);
    text-decoration: underline;
  }
`;

type ImportSource = "imdb" | "letterboxd" | "simkl";

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
  const [importSource, setImportSource] = useState<ImportSource>("imdb");
  const [importFile, setImportFile] = useState<File>();
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

  const importWatchedMovies = async () => {
    if (!importFile) return;
    if (importFile.size > 5 * 1024 * 1024) {
      setImportStatus("Please choose a CSV file smaller than 5 MB.");
      return;
    }
    setIsImporting(true);
    setImportStatus("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in again to import watched movies.");
      const response = await fetch("/api/import/watched", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ source: importSource, csv: await importFile.text() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not import watched movies.");
      await refreshSeenMovies();
      setImportStatus(
        `Imported ${result.imported} new movies. ${result.alreadySeen} were already marked seen and left unchanged; ${result.unmatched} were not in the catalog.${result.skipped ? ` ${result.skipped} invalid or non-movie rows were skipped.` : ""}`
      );
      setImportFile(undefined);
    } catch (error) {
      setImportStatus(error instanceof Error ? error.message : "Could not import watched movies.");
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
          {/* <Box $marginTop="xxxl" $marginBottom="lg">
            <Heading size="lg" marginBottom="md">
              Export your data
            </Heading>
            <Button
              type="button"
              onClick={handleExport}
              label="Export"
              variant="secondary"
            />
          </Box> */}

          <Box $marginTop="xxl" $marginBottom="lg">
            <Heading size="lg" marginBottom="sm">
              Import watched movies
            </Heading>
            <Paragraph marginBottom="sm">
              Import watched dates from IMDb, Letterboxd, or Simkl. Only movies in this catalog are added.
            </Paragraph>
            <ImportTabs role="tablist" aria-label="Choose import source">
              {([["imdb", "IMDb"], ["letterboxd", "Letterboxd"], ["simkl", "Simkl"]] as const).map(([source, label]) => (
                <ImportTab
                  key={source}
                  type="button"
                  role="tab"
                  aria-selected={importSource === source}
                  $active={importSource === source}
                  onClick={() => {
                    setImportSource(source);
                    setImportFile(undefined);
                    setImportStatus("");
                  }}
                >
                  {label}
                </ImportTab>
              ))}
            </ImportTabs>
            <ImportInstructions>
              {importSource === "imdb" && (
                <p>
                  On IMDb, open your profile, choose <strong>Your Ratings</strong>, then select <strong>Export</strong> near the top of the page. Upload the downloaded CSV. Its <strong>Date Rated</strong> is used as the watched date. See IMDb&apos;s <a href="https://help.imdb.com/article/imdb/track-movies-tv/ratings-faq/G67Y87TFYYP6TWAV" target="_blank" rel="noreferrer">export instructions</a>.
                </p>
              )}
              {importSource === "letterboxd" && (
                <p>
                  In Letterboxd, open <strong>Settings → Data → Export your data</strong>, download and unzip the archive, then choose <strong>watched.csv</strong>. The <strong>Date</strong> column is used as the watched date, and each Letterboxd URI is followed to find its film slug. <a href="https://letterboxd.com/user/exportdata/" target="_blank" rel="noreferrer">Export Letterboxd data</a>.
                </p>
              )}
              {importSource === "simkl" && (
                <p>
                  On Simkl, open <a href="https://simkl.com/apps/backup/" target="_blank" rel="noreferrer">Apps → Export → Backup</a>. Simkl&apos;s standard CSV backup is PRO-only and does not include individual watch dates, so it cannot be imported here as-is. This importer needs a CSV with <strong>Simkl ID</strong> (or an <strong>IDs</strong> column containing Simkl IDs) and <strong>WatchedDate</strong> or <strong>Last Watched</strong> columns. The JSON backup is not accepted by this CSV importer.
                </p>
              )}
            </ImportInstructions>
            <Flex $direction="column" $gap="sm" $alignItems="flex-start">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  setImportFile(event.currentTarget.files?.[0]);
                  setImportStatus("");
                }}
                aria-label={`Choose ${importSource} watched movies CSV`}
              />
              <Button
                type="button"
                onClick={importWatchedMovies}
                label={`Import ${importSource === "imdb" ? "IMDb" : importSource === "letterboxd" ? "Letterboxd" : "Simkl"}`}
                isLoading={isImporting}
                disabled={!importFile || isImporting}
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
