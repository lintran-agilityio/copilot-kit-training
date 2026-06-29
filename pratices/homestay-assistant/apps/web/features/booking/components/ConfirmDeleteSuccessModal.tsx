import { ConfirmSuccess } from "@/components/confirm-modal";
import { useState } from "react";

export const ConfirmDeleteSuccessModal = () => {
  const [open, setOpen] = useState<boolean>(true);

  const handleOpenChange = () => {
    setOpen((prev) => !prev);
  };

  return (
    <ConfirmSuccess
      open={open}
      onOpenChange={handleOpenChange}
      title="Booking cancelled"
      description="Your reservation has been cancelled successfully."
    />
  );
};
