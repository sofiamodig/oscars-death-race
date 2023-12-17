import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db } from "@/firebaseConfig";
import { ErrorIcon } from "@/assets/icons/ErrorIcon";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { TextInput } from "@/components/textInput";
import { useAuth, createUser } from "@/hooks/useAuth";
import { Box } from "@/styles/Box";
import { ErrorMessage } from "@/styles/Message";
import { validateEmail, validateUsername, validatePassword } from "@/utils";
import { collection, getDocs } from "@firebase/firestore";

type Errors = {
  username?: string;
  email?: string;
  password?: string;
  acceptedTerms?: string;
  general?: string;
};

const Signup = () => {
  const { isSignedIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const router = useRouter();

  if (isSignedIn) {
    setTimeout(() => {
      router.push("/");
    });
  }

  const handleForm = (e: any) => {
    setErrors(undefined);
    e.preventDefault();
    setLoading(true);

    const newErrors: Errors = {};

    newErrors.email = validateEmail(email);

    newErrors.password = validatePassword(password);

    newErrors.username = validateUsername(username);

    if (!acceptedTerms) {
      newErrors.acceptedTerms = "You must accept the terms";
    }

    if (Object.values(newErrors).filter(Boolean).length > 0) {
      setLoading(false);
      setErrors(newErrors);
      return;
    }

    createUser(email, password, username)
      .then((res) => {
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        setErrors(error.message);
      });
  };

  return (
    <Box
      $maxWidth="400px"
      $marginLeft="auto"
      $marginRight="auto"
      $marginTop="md"
    >
      <Heading size="xxl" marginBottom="lg" textAlign="center">
        Sign up
      </Heading>
      <form onSubmit={(e: any) => handleForm(e)}>
        <Box $marginBottom="md">
          <TextInput
            value={username}
            setValue={(value) => setUsername(value)}
            label="Username"
            type="text"
            placeholder="Username"
            errorMessage={errors?.username}
          />
          <Paragraph size="xs" color="var(--color-text-secondary)">
            This username will show up in the leaderboard
          </Paragraph>
        </Box>
        <Box $marginBottom="md">
          <TextInput
            value={email}
            setValue={(value) => setEmail(value)}
            label="Email"
            type="email"
            placeholder="E-mail"
            errorMessage={errors?.email}
          />
        </Box>
        <Box $marginBottom="md">
          <TextInput
            setValue={(value) => setPassword(value)}
            label="Password"
            value={password}
            type="password"
            placeholder="Password"
            errorMessage={errors?.password}
          />
        </Box>

        <Box $marginBottom="md">
          <Checkbox
            label="I accept that my information will be saved to be used on this site."
            checked={acceptedTerms}
            onChange={() => setAcceptedTerms(!acceptedTerms)}
          />
          {errors?.acceptedTerms && (
            <ErrorMessage>{errors.acceptedTerms}</ErrorMessage>
          )}
        </Box>

        {errors?.general && (
          <Box $marginBottom="md" $marginTop="md">
            <ErrorMessage>
              <ErrorIcon />
              {errors.general}
            </ErrorMessage>
          </Box>
        )}

        <Button
          type="submit"
          onClick={handleForm}
          label="Sign up"
          isLoading={loading}
          width="100%"
        />
      </form>
    </Box>
  );
};

export default Signup;
