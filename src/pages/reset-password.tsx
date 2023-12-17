import { useState } from "react";
import { sendPasswordResetEmail } from "@firebase/auth";
import { useRouter } from "next/router";
import { InfoIcon } from "@/assets/icons/InfoIcon";
import { Button } from "@/components/button";
import { Heading } from "@/components/heading";
import { TextInput } from "@/components/textInput";
import { auth } from "@/firebaseConfig";
import { useAuth } from "@/hooks/useAuth";
import { Box } from "@/styles/Box";
import { InfoMessage, ErrorMessage } from "@/styles/Message";

type Errors = {
  email?: string;
  general?: string;
};

const ResetPassword = () => {
  const { isSignedIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [errors, setErrors] = useState<Errors>();
  const router = useRouter();

  if (isSignedIn) {
    setTimeout(() => {
      router.push("/");
    });
  }

  const handleForm = (e: any) => {
    e.preventDefault();
    setLoading(true);

    if (!email) {
      setErrors({ email: "Email is required" });
      setLoading(false);
      return;
    }

    sendPasswordResetEmail(auth, email)
      .then(() => {
        setLoading(false);
        setShowSuccess(true);
      })
      .catch(() => {
        setLoading(false);
        setErrors({ general: "User is not found" });
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
        Reset password
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

        {showSuccess && (
          <Box $marginBottom="md" $marginTop="md">
            <InfoMessage>
              <InfoIcon />
              An email has been sent to {email} with further instructions.
            </InfoMessage>
          </Box>
        )}

        {errors?.general && (
          <Box $marginBottom="md" $marginTop="md">
            <ErrorMessage>{errors.general}</ErrorMessage>
          </Box>
        )}

        <Button
          type="submit"
          onClick={handleForm}
          label="Reset password"
          isLoading={loading}
          width="100%"
        />
      </form>
    </Box>
  );
};

export default ResetPassword;
