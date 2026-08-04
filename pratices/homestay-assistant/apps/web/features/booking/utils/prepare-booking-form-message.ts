import { buildBookingFormMessage } from "@/features/booking/utils/build-messages";
import { useArtifactStore } from "@/features/chat/stores/artifact-store";

/**
 * Start a booking-form artifact (expires prior interactive forms) and build
 * the `[book-form]` agent message that carries `artifactId`.
 */
export const prepareBookingFormMessage = (
  roomId: string,
  roomName: string,
) => {
  const artifactId = useArtifactStore.getState().registerBookingForm(roomId);
  return {
    artifactId,
    message: buildBookingFormMessage(roomId, roomName, artifactId),
  };
};
