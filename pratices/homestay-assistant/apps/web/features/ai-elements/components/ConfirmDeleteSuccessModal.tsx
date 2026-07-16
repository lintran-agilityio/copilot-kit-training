import { ConfirmSuccess } from "@/components/confirm-modal";

type ConfirmDeleteSuccessModalProps = {
  open: boolean;
  roomName?: string;
  onOpenChange: (open: boolean) => void;
};

export const ConfirmDeleteSuccessModal = ({
  open,
  roomName,
  onOpenChange,
}: ConfirmDeleteSuccessModalProps) => (
  <ConfirmSuccess
    open={open}
    onOpenChange={onOpenChange}
    title="Booking cancelled"
    description={
      roomName
        ? `Your reservation for ${roomName} has been cancelled successfully.`
        : "Your reservation has been cancelled successfully."
    }
  />
);
