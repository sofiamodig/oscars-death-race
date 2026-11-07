import { useState } from "react";
import type { FormEvent } from "react";
import { InfoIcon } from "@/assets/icons/InfoIcon";
import { Button } from "@/components/button";
import { TextInput } from "@/components/textInput";
import { supabase } from "@/supabase";
import { ErrorMessage, InfoMessage } from "@/styles/Message";

const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [requestSent, setRequestSent] = useState(false);

  const handleForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailError("");
    setGeneralError("");
    setRequestSent(false);

    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setLoading(false);

    if (error) {
      setGeneralError(error.message);
      return;
    }

    // Supabase intentionally returns success whether or not the email exists.
    setRequestSent(true);
  };

  return (
    <div className="mt-6 ml-auto mr-auto max-w-sm">
      <h1 className="heading text-3xl !mb-8 text-center">
        Reset password
      </h1>
      <form onSubmit={handleForm}>
        <div className="mb-6">
          <TextInput
            value={email}
            setValue={setEmail}
            label="Email"
            type="email"
            placeholder="E-mail"
            errorMessage={emailError}
          />
        </div>

        {requestSent && (
          <div className="mt-6 mb-6">
            <InfoMessage>
              <InfoIcon />
              If an account exists for {email.trim()}, password reset
              instructions have been sent.
            </InfoMessage>
          </div>
        )}

        {generalError && (
          <div className="mt-6 mb-6">
            <ErrorMessage>{generalError}</ErrorMessage>
          </div>
        )}

        <Button
          type="submit"
          label="Send reset link"
          isLoading={loading}
          width="100%"
        />
      </form>
    </div>
  );
};

export default ResetPassword;
