import { AdminSettings } from "@/components/adminSettings";
import { Button } from "@/components/button";
import exportToCsv from "@/components/exportToCSV";
import { Modal } from "@/components/modal";
import { TextInput } from "@/components/textInput";
import { Toggle } from "@/components/toggle";
import { useSeenContext } from "@/contexts/seenContext";
import { useSnackbarContext } from "@/contexts/snackbarContext";
import { useAuth, emailChange, userDeletion } from "@/hooks/useAuth";
import { Loader } from "@/styles/Loader";
import { validateEmail, validateUsername } from "@/utils";
import { useRouter } from "next/router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/supabase";
import { useThemePreference } from "@/contexts/themeContext";
import type { ThemePreference } from "@/contexts/themeContext";
import { useMovieCatalog } from "@/hooks/useMovieCatalog";
import { trackAnalyticsEvent } from "@/utils/analytics";

type ButtonLoadingType = "email" | "password" | "username" | "delete";
type ImportSource = "imdb" | "letterboxd";

export default function Settings() {
  const { movies: catalog = [] } = useMovieCatalog();
  const movies = useMemo(() => [...catalog].reverse(), [catalog]);
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
  const { themePreference, setThemePreference } = useThemePreference();

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
    const exportedMovies = exportToCsv(seenMovies, movies, "seen_movies");
    trackAnalyticsEvent("movie_data_exported", { format: "csv", movie_count: exportedMovies });
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
      const isLetterboxd = importSource === "letterboxd";
      const response = await fetch(isLetterboxd ? "/api/import/letterboxd" : "/api/import/imdb-ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ csv: await importFile.text() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not import watched movies.");
      await refreshSeenMovies();
      trackAnalyticsEvent("movie_data_imported", {
        source: importSource,
        imported_count: Number(result.imported) || 0,
        already_seen_count: Number(result.alreadySeen) || 0,
        unmatched_count: Number(result.unmatched) || 0,
        skipped_count: Number(result.skipped) || 0,
      });
      setImportStatus(
        `Imported ${result.imported} new movies. ${result.alreadySeen} were already marked seen and left unchanged; ${result.unmatched} were not in the catalog.${result.skipped ? ` ${result.skipped} invalid or duplicate rows were skipped.` : ""}`
      );
      setImportFile(undefined);
    } catch (error) {
      trackAnalyticsEvent("movie_data_import_failed", { source: importSource });
      setImportStatus(error instanceof Error ? error.message : "Could not import watched movies.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="ml-auto mr-auto max-w-xl">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h2 className="heading text-2xl">Settings</h2>
        {userId && (
          <button className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap border-0 bg-transparent py-1.5 font-sans text-indigo-700 underline hover:text-indigo-900 dark:text-white dark:hover:no-underline [&_svg]:h-[18px] [&_svg]:w-[18px]" type="button" onClick={handleSignOut}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10 17l5-5-5-5" />
              <path d="M15 12H3" />
              <path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" />
            </svg>
            Log out
          </button>
        )}
      </div>
      <section className="mb-8 border-b border-neutral-300 pb-6 dark:border-neutral-700">
        <label className="block text-sm font-medium" htmlFor="theme-preference">Theme</label>
        <div className="custom-select-wrapper mt-2" style={{ width: "220px" }}>
          <select
            id="theme-preference"
            value={themePreference}
            onChange={(event) => setThemePreference(event.currentTarget.value as ThemePreference)}
          >
            <option value="system">Use system setting</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </section>
      {!userId || !userSettings ? (
        <Loader />
      ) : (
        <>
          <div className="flex flex-row justify-between items-end gap-4 mb-8">
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
          </div>
          <div className="flex flex-row justify-between items-end gap-4 mb-8">
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
          </div>
          <div className="flex flex-col justify-between items-start gap-6 mb-8">
            <Toggle
              label="Hide seen dates in the movie list"
              value={userSettings.hideSeenDates ?? false}
              onToggle={toggleShowSeenDates}
            />
            <Toggle
              label="Show your user in the leaderboard"
              value={showInLeaderboard ?? true}
              onToggle={() => {
                setShowInLeaderboard((prev) => !prev);
                changeShowInLeaderboard();
              }}
            />
            <Toggle
              label="Progress by watchtime instead of movie count"
              value={percentageByWatchTime ?? false}
              onToggle={() => {
                setPercentageByWatchTime((prev) => !prev);
                togglePercentageByWatchTime();
              }}
            />
          </div>
          <div className="mt-12 mb-8">
            <h3 className="heading text-lg !mb-4">
              Movie links
            </h3>
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
          </div>
          <div className="mt-16 mb-8">
            <h2 className="heading text-2xl !mb-6">
              Export your data
            </h2>
            <Button
              type="button"
              onClick={handleExport}
              label="Export"
              variant="secondary"
            />
          </div>

          <div className="mt-12 mb-8">
            <h2 className="heading text-2xl !mb-4">Import watched movies</h2>
            <p className="!mb-4">Import watched movies from IMDb or Letterboxd. Already checked movies on this site will not be affected.</p>
            <div className="mb-4 flex gap-2 border-b border-neutral-300 dark:border-neutral-700" role="tablist" aria-label="Choose import source">
              {(["imdb", "letterboxd"] as const).map((source) => (
                <button
                  key={source}
                  type="button"
                  role="tab"
                  aria-selected={importSource === source}
                  className={`border-0 border-b-2 px-3 py-2 font-semibold ${importSource === source ? "border-[#b39930] text-[#897b2c] dark:border-[#968242] dark:text-[#968242]" : "border-transparent bg-transparent text-neutral-600 hover:text-[#897b2c] dark:text-neutral-300 dark:hover:text-[#605227]"}`}
                  onClick={() => {
                    setImportSource(source);
                    setImportFile(undefined);
                    setImportStatus("");
                  }}
                >
                  {source === "imdb" ? "IMDb" : "Letterboxd"}
                </button>
              ))}
            </div>
            <div className="!mb-4">
              {importSource === "imdb" ? (
                <div>
                  <ol className="list-decimal ml-8 mt-1">
                    <li>Log in to your account on IMDb using a desktop browser.</li>
                    <li>Click your profile name or avatar in the top-right corner and select Your Ratings.</li>
                    <li>Click the three vertical dots (or the export icon) located at the top right of your ratings page.</li>
                    <li>Upload the exported ratings.csv file here</li>
                  </ol>
                  <p className="mt-2">The <strong>date rated</strong> is used as the watched date.</p>
                </div>
              ) : (
                <div>
                  <ol className="list-decimal ml-8 mt-1">
                    <li>Log into Letterboxd and then go to <a href="https://letterboxd.com/user/exportdata/" target="_BLANK">https://letterboxd.com/user/exportdata/</a> OR <strong>Settings → Data → Export your data</strong></li>
                    <li>Download and unzip the archive</li>
                    <li>Upload the exported watched.csv file here</li>
                  </ol>
                  <p className="mt-2">The <strong>Date</strong> column is used as the watched date.</p>
                </div>
              )}
            </div>
            <div className="flex flex-col justify-between items-start gap-4">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  setImportFile(event.currentTarget.files?.[0]);
                  setImportStatus("");
                }}
                aria-label={`Choose ${importSource === "imdb" ? "IMDb ratings" : "Letterboxd watched"} CSV`}
              />
              <Button
                type="button"
                onClick={importWatchedMovies}
                label={`Import ${importSource === "imdb" ? "IMDb ratings" : "Letterboxd watched movies"}`}
                isLoading={isImporting}
                disabled={!importFile || isImporting}
              />
              {importStatus && <p className="">{importStatus}</p>}

              {isImporting && <p>It may take a couple of minutes, stay on the page!</p>}
            </div>
          </div>

        </>
      )}

      {isAdmin && <AdminSettings />}

      {userId && userSettings && (
        <details className="mt-[112px] mb-8 border-t border-neutral-300 pt-12 [&_summary]:w-fit [&_summary]:cursor-pointer [&_summary]:text-sm [&_summary]:font-semibold [&_summary]:text-red-600 [&_button]:mt-3">
          <summary>Danger zone</summary>
          <Button
            type="button"
            onClick={() => setDeleteModal(true)}
            label="Delete account"
            variant="danger"
          />
        </details>
      )}

      {deleteModal && (
        <Modal
          isOpen={deleteModal}
          onClose={() => setDeleteModal(false)}
          maxWidth="400px"
        >
          <div className="flex flex-col justify-between items-center gap-4">
            <h2 className="heading text-2xl">Delete account</h2>
            <p className=" !mb-6 text-center">
              Are you sure you want to delete your account? This action is
              irreversible.
            </p>
            <div>
              <Button
                onClick={deleteUserData}
                label="Delete account"
                variant="danger"
                isLoading={loading === "delete"}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
