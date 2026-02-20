import {Composition} from "remotion";
import {UiReasoningJourney} from "./UiReasoningJourney";

export const RemotionRoot = () => {
  return (
    <Composition
      id="UiReasoningJourney"
      component={UiReasoningJourney}
      durationInFrames={180}
      fps={30}
      width={1536}
      height={1024}
    />
  );
};
