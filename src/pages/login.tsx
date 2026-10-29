import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ErrorIcon } from "@/assets/icons/ErrorIcon";
import { Button } from "@/components/button";
import { TextInput } from "@/components/textInput";
import { supabase } from "@/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Box } from "@/styles/Box";
import { ErrorMessage } from "@/styles/Message";

type Errors = {
  email?: string;
  password?: string;
  general?: string;
};

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>();
  const router = useRouter();
  const { isSignedIn, isReady } = useAuth();

  useEffect(() => {
    if (isReady && isSignedIn) void router.replace("/");
  }, [isReady, isSignedIn, router]);

  const handleForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors(undefined);

    const newErrors: Errors = {};
    if (!email.trim()) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrors({ general: "Invalid email or password." });
        return;
      }

      await router.replace("/");
    } catch (error: any) {
      setErrors({ general: error.message ?? "Could not log in." });
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
      <h1 className="heading text-3xl !mb-8 text-center">
        Log in
      </h1>
      <form onSubmit={handleForm}>
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

        {errors?.general && (
          <Box $marginBottom="6" $marginTop="6">
            <ErrorMessage>
              <ErrorIcon />
              {errors.general}
            </ErrorMessage>
          </Box>
        )}

        <Button
          type="submit"
          label="Log in"
          isLoading={loading}
          width="100%"
        />
        <Box $marginTop="4">
          <p className="text-sm text-right">
            <Link href="/reset-password">Forgot password?</Link>
          </p>
        </Box>
      </form>
    </Box>
  );
};

export default Login;
