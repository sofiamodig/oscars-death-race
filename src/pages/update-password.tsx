import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { ErrorIcon } from "@/assets/icons/ErrorIcon";
import { InfoIcon } from "@/assets/icons/InfoIcon";
import { Button } from "@/components/button";
import { TextInput } from "@/components/textInput";
import { supabase } from "@/supabase";
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
    <div className="mt-6 ml-auto mr-auto max-w-sm">
      <h1 className="heading text-3xl !mb-8 text-center">
        Choose a new password
      </h1>

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
          <div className="mb-6">
            <TextInput
              value={password}
              setValue={setPassword}
              label="New password"
              type="password"
            />
          </div>
          <div className="mb-6">
            <TextInput
              value={confirmPassword}
              setValue={setConfirmPassword}
              label="Confirm new password"
              type="password"
            />
          </div>

          <Button
            type="submit"
            label="Update password"
            isLoading={loading}
            width="100%"
          />
        </form>
      )}

      {errorMessage && hasSession && !success && (
        <div className="mt-6">
          <ErrorMessage>{errorMessage}</ErrorMessage>
        </div>
      )}
    </div>
  );
};

export default UpdatePassword;
