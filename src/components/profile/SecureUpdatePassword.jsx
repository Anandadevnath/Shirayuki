import React, { useState } from "react";
import UpdatePasswordForm from "./UpdatePasswordForm";
import VerifyEmailStep from "./VerifyEmailStep";

export default function SecureUpdatePassword() {
  const [verifiedEmail, setVerifiedEmail] = useState(null);

  return (
    <div>
      {!verifiedEmail ? (
        <VerifyEmailStep onVerified={setVerifiedEmail} />
      ) : (
        <UpdatePasswordForm email={verifiedEmail} />
      )}
    </div>
  );
}
