import { useState } from "react";
import type { FormEvent } from "react";
import { InfoIcon } from "@/assets/icons/InfoIcon";
import { Button } from "@/components/button";
import { Heading } from "@/components/heading";
import { TextInput } from "@/components/textInput";
import { supabase } from "@/supabase";
import { Box } from "@/styles/Box";
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
    <Box
      $maxWidth="400px"
      $marginLeft="auto"
      $marginRight="auto"
      $marginTop="6"
    >
      <Heading size="xxl" marginBottom="8" textAlign="center">
        Reset password
      </Heading>
      <form onSubmit={handleForm}>
        <Box $marginBottom="6">
          <TextInput
            value={email}
            setValue={setEmail}
            label="Email"
            type="email"
            placeholder="E-mail"
            errorMessage={emailError}
          />
        </Box>

        {requestSent && (
          <Box $marginBottom="6" $marginTop="6">
            <InfoMessage>
              <InfoIcon />
              If an account exists for {email.trim()}, password reset
              instructions have been sent.
            </InfoMessage>
          </Box>
        )}

        {generalError && (
          <Box $marginBottom="6" $marginTop="6">
            <ErrorMessage>{generalError}</ErrorMessage>
          </Box>
        )}

        <Button
          type="submit"
          label="Send reset link"
          isLoading={loading}
          width="100%"
        />
      </form>
    </Box>
  );
};

export default ResetPassword;
