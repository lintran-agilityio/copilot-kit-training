import { ConfirmSuccess } from "@/components/confirm-modal";

type ConfirmDeleteSuccessModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const ConfirmDeleteSuccessModal = ({
  open,
  onOpenChange,
}: ConfirmDeleteSuccessModalProps) => (
  <ConfirmSuccess
    open={open}
    onOpenChange={onOpenChange}
    title="Booking cancelled"
    description="Your reservation has been cancelled successfully."
  />
);
