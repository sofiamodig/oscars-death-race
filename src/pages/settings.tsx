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
import { auth, db } from "@/firebaseConfig";
import { fetchMovies } from "@/functions/fetchMovies";
import { useAuth, emailChange, userDeletion } from "@/hooks/useAuth";
import { Box } from "@/styles/Box";
import { Flex } from "@/styles/Flex";
import { Loader } from "@/styles/Loader";
import { MoviesYearsListType } from "@/types";
import { validateEmail } from "@/utils";
import { signOut } from "@firebase/auth";
import { updateDoc, doc, deleteDoc } from "@firebase/firestore";
import { GetStaticProps, InferGetStaticPropsType } from "next";
import { useRouter } from "next/router";
import { useContext, useState, useEffect } from "react";

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
    userSettings,
    changeUserName,
    changeShowInLeaderboard,
    toggleShowSeenDates,
    togglePercentageByWatchTime
  } = useSeenContext();
  const router = useRouter();
  const [showInLeaderboard, setShowInLeaderboard] = useState<boolean>();
  const [percentageByWatchTime, setPercentageByWatchTime] = useState<boolean>(false);
  const [username, setUsername] = useState<string>();
  const [loading, setLoading] = useState<ButtonLoadingType>();
  const [newEmail, setNewEmail] = useState<string>("");
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const { showSnackbar } = useSnackbarContext();

  const handleSignOut = () => {
    signOut(auth);
    router.push("/");
  };

  useEffect(() => {
    if (!username) {
      setUsername(userSettings?.username);
    }

    if (!showInLeaderboard) {
      setShowInLeaderboard(
        userSettings.showInLeaderboard !== undefined
          ? userSettings.showInLeaderboard
          : true
      );
    }

    if (!percentageByWatchTime) {
      setPercentageByWatchTime(
        userSettings.percentageByWatchTime !== undefined
          ? userSettings.percentageByWatchTime
          : false
      );
    }
  }, [userSettings, username]);

  const updateUsername = async () => {
    setLoading("username");

    if (username && username !== userSettings?.username && userId) {
      updateDoc(doc(db, "users", userId), {
        username: username,
      })
        .then(() => {
          changeUserName(username);
          showSnackbar("Username was successfully changed", "success");
          setLoading(undefined);
        })
        .catch((error) => {
          showSnackbar(error.message, "error");
          setLoading(undefined);
        });
    }
  };

  const changeEmail = async () => {
    setLoading("email");

    const emailError = validateEmail(newEmail);
    if (emailError) {
      showSnackbar(emailError, "error");
    } else {
      await emailChange(newEmail)
        .then(() => {
          setLoading(undefined);
          showSnackbar(
            "A verification email has been sent to your new email",
            "success"
          );
          router.push("/login");
        })
        .catch((error) => {
          setLoading(undefined);
          showSnackbar(error.message, "error");
        });
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

  const deleteUserData = () => {
    // Delete user data document
    if (!userId) return;

    deleteDoc(doc(db, "users", userId))
      .then(() => {
        console.log("Document successfully deleted!");
        deleteAccount();
      })
      .catch((error) => {
        showSnackbar(error.message, "error");
        setLoading(undefined);
      });
  };

  const handleExport = () => {
    exportToCsv(seenMovies, movies, "seen_movies");
  };

  return (
    <Box $maxWidth="600px" $marginLeft="auto" $marginRight="auto">
      <Heading size="lg" marginBottom="md">
        Settings
      </Heading>
      {!userId || !userSettings ? (
        <Loader />
      ) : (
        <>
          <Flex $alignItems="flex-end" $gap="sm" $marginBottom="md">
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
          <Flex $alignItems="flex-end" $gap="sm" $marginBottom="md">
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
            $gap="sm"
            $marginBottom="md"
            $alignItems="flex-start"
          >
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
              value={percentageByWatchTime ?? true}
              onToggle={() => {
                setPercentageByWatchTime((prev) => !prev);
                togglePercentageByWatchTime();
              }}
            />
          </Flex>
          <Box $marginTop="md" $marginBottom="md">
            <Button onClick={handleSignOut} label="Log out" />
          </Box>

          <Box $marginTop="lg" $marginBottom="md">
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

          <Box $marginTop="lg" $marginBottom="md">
            <Heading size="lg" marginBottom="md">
              Danger zone
            </Heading>
            <Button
              type="button"
              onClick={() => setDeleteModal(true)}
              label="Delete account"
              variant="danger"
            />
          </Box>
        </>
      )}

      {isAdmin && <AdminSettings />}

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
