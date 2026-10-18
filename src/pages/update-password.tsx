import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { ErrorIcon } from "@/assets/icons/ErrorIcon";
import { InfoIcon } from "@/assets/icons/InfoIcon";
import { Button } from "@/components/button";
import { Heading } from "@/components/heading";
import { TextInput } from "@/components/textInput";
import { supabase } from "@/supabase";
import { Box } from "@/styles/Box";
import { ErrorMessage, InfoMessage } from "@/styles/Message";
import { validatePassword } from "@/utils";

const UpdatePassword = () => {
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setHasSession(Boolean(data.session));
      setCheckingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasSession(true);
        setCheckingSession(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const passwordError = validatePassword(password);
    if (passwordError) {
      setErrorMessage(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccess(true);
    await supabase.auth.signOut();
  };

  return (
    <Box
      $maxWidth="400px"
      $marginLeft="auto"
      $marginRight="auto"
      $marginTop="md"
    >
      <Heading size="xxl" marginBottom="lg" textAlign="center">
        Choose a new password
      </Heading>

      {checkingSession ? (
        <InfoMessage>Checking your password reset link…</InfoMessage>
      ) : success ? (
        <InfoMessage>
          <InfoIcon />
          Password updated. You can now <Link href="/login">log in</Link>.
        </InfoMessage>
      ) : !hasSession ? (
        <ErrorMessage>
          <ErrorIcon />
          This password reset link is invalid or expired. Request a new one from
          the <Link href="/reset-password">password reset page</Link>.
        </ErrorMessage>
      ) : (
        <form onSubmit={handleForm}>
          <Box $marginBottom="md">
            <TextInput
              value={password}
              setValue={setPassword}
              label="New password"
              type="password"
            />
          </Box>
          <Box $marginBottom="md">
            <TextInput
              value={confirmPassword}
              setValue={setConfirmPassword}
              label="Confirm new password"
              type="password"
            />
          </Box>

          <Button
            type="submit"
            label="Update password"
            isLoading={loading}
            width="100%"
          />
        </form>
      )}

      {errorMessage && hasSession && !success && (
        <Box $marginTop="md">
          <ErrorMessage>{errorMessage}</ErrorMessage>
        </Box>
      )}
    </Box>
  );
};

export default UpdatePassword;
