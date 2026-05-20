import Loading from "@/src/components/Loading";
import VerifyOtp from "@/src/components/VerifyOtp";
import { Suspense } from "react";

const VerificationPage = () => {
  
  return (
    <Suspense fallback={<Loading />}>
      <VerifyOtp />
    </Suspense>
  )
}

export default VerificationPage;