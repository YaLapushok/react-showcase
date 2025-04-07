import ConfirmClient from "./ConfirmClient";

export default function ConfirmPage({ params }: { params: { token: string } }) {
  return <ConfirmClient token={params.token} />;
}
