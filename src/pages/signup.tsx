import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/router";
import { ErrorIcon } from "@/assets/icons/ErrorIcon";
import { InfoIcon } from "@/assets/icons/InfoIcon";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { TextInput } from "@/components/textInput";
import { supabase } from "@/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Box } from "@/styles/Box";
import { ErrorMessage, InfoMessage } from "@/styles/Message";
import { validateEmail, validatePassword, validateUsername } from "@/utils";

type Errors = {
  username?: string;
  email?: string;
  password?: string;
  acceptedTerms?: string;
  general?: string;
};

const Signup = () => {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();
  const { isSignedIn, isReady } = useAuth();

  useEffect(() => {
    if (isReady && isSignedIn) void router.replace("/");
  }, [isReady, isSignedIn, router]);

  const handleForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors(undefined);
    setSuccessMessage("");

    const newErrors: Errors = {
      email: validateEmail(email),
      password: validatePassword(password),
      username: validateUsername(username),
    };

    if (!acceptedTerms) {
      newErrors.acceptedTerms = "You must accept the terms";
    }

    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { username: username.trim() },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        setErrors({
          general:
            error.code === "23505"
              ? "That username is already taken. Please choose another."
              : error.message,
        });
        return;
      }

      // With email confirmation disabled, signUp returns a session and the
      // user is already logged in. Fall back to sign-in for configurations
      // that create the account but don't return a session.
      if (!data.session) {
        const { data: loginData, error: loginError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
        if (loginError || !loginData.session) {
          setSuccessMessage(
            "Your account was created, check your email to confirm your account."
          );
          return;
        }
      }

      await router.replace("/");
    } catch (error: any) {
      setErrors({ general: error.message ?? "Could not create your account." });
    } finally {
      setLoading(false);
    }
  };

  if (!isReady || isSignedIn) return null;

  return (
    <Box
      $maxWidth="400px"
      $marginLeft="auto"
      $marginRight="auto"
      $marginTop="6"
    >
      <Heading size="xxl" marginBottom="8" textAlign="center">
        Sign up
      </Heading>
      <form onSubmit={handleForm}>
        <Box $marginBottom="6">
          <TextInput
            value={username}
            setValue={setUsername}
            label="Username"
            type="text"
            placeholder="Username"
            errorMessage={errors?.username}
          />
          <Paragraph size="xs" color="#404040">
            This username will show up in the leaderboard. Spaces are allowed.
          </Paragraph>
        </Box>
        <Box $marginBottom="6">
          <TextInput
            value={email}
            setValue={setEmail}
            label="Email"
            type="email"
            placeholder="E-mail"
            errorMessage={errors?.email}
          />
        </Box>
        <Box $marginBottom="6">
          <TextInput
            setValue={setPassword}
            label="Password"
            value={password}
            type="password"
            placeholder="Password"
            errorMessage={errors?.password}
          />
        </Box>

        <Box $marginBottom="6">
          <Checkbox
            label="I accept that my information will be saved to be used on this site."
            checked={acceptedTerms}
            onChange={setAcceptedTerms}
          />
          {errors?.acceptedTerms && (
            <ErrorMessage>{errors.acceptedTerms}</ErrorMessage>
          )}
        </Box>

        {errors?.general && (
          <Box $marginBottom="6" $marginTop="6">
            <ErrorMessage>
              <ErrorIcon />
              {errors.general}
            </ErrorMessage>
          </Box>
        )}

        {successMessage && (
          <Box $marginBottom="6" $marginTop="6">
            <InfoMessage>
              <InfoIcon />
              {successMessage}
            </InfoMessage>
          </Box>
        )}

        <Button
          type="submit"
          label="Sign up"
          isLoading={loading}
          width="100%"
        />
      </form>
    </Box>
  );
};

export default Signup;
