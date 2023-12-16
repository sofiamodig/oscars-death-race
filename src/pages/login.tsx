import { useState } from "react";
import { useRouter } from "next/router";
import { signIn, useAuth } from "@/hooks/useAuth";
import { ErrorIcon } from "@/assets/icons/ErrorIcon";
import { Button } from "@/components/button";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { TextInput } from "@/components/textInput";
import { Box } from "@/styles/Box";
import { ErrorMessage } from "@/styles/Message";
import Link from "next/link";

type Errors = {
  email?: string;
  password?: string;
  general?: string;
};

const Login = () => {
  const { isSignedIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>();
  const router = useRouter();

  if (isSignedIn) {
    router.push("/");
  }

  const handleForm = (e: any) => {
    setErrors(undefined);
    e.preventDefault();
    setLoading(true);

    const newErrors: Errors = {};
    if (!email) {
      newErrors.email = "Email is required";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setLoading(false);
      setErrors(newErrors);
      return;
    }

    signIn(email, password)
      .then(() => {
        setLoading(false);
        router.push("/");
      })
      .catch((error) => {
        setLoading(false);
        setErrors((prev) => ({ ...prev, general: error.message }));
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
        Log in
      </Heading>
      <form onSubmit={(e: any) => handleForm(e)}>
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
          label="Log in"
          isLoading={loading}
          width="100%"
        />
        <Box $marginTop="sm">
          <Paragraph size="sm" textAlign="right">
            <Link href="/reset-password">Forgot password?</Link>
          </Paragraph>
        </Box>
      </form>
    </Box>
  );
};

export default Login;
