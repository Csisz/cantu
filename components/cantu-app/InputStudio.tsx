"use client";

import { useReducer } from "react";
import { createInitialInputStudioState, inputStudioReducer } from "@/lib/input/studio-reducer";
import type { InputMode } from "@/lib/input/types";
import { AudioFileInput } from "./audio/AudioFileInput";
import { InputModeTabs } from "./InputModeTabs";
import { LearningPreview } from "./LearningPreview";
import { ListenInput } from "./listen/ListenInput";
import { SourceConfirmation } from "./SourceConfirmation";
import { TextInput } from "./text/TextInput";
import styles from "./app.module.css";

export function InputStudio({ initialMode }: { initialMode: InputMode }) {
  const [state, dispatch] = useReducer(
    inputStudioReducer,
    initialMode,
    createInitialInputStudioState,
  );

  function selectMode(mode: InputMode) {
    dispatch({ type: "SELECT_MODE", mode });
    window.history.replaceState(null, "", `/app?mode=${mode}`);
  }

  return (
    <div className={styles.flowCard}>
      {state.status === "entry" ? (
        <>
          <InputModeTabs activeMode={state.mode} onSelect={selectMode} />
          <div className={styles.statusRegion} aria-live="polite">
            {state.mode === "listen" ? (
              <ListenInput onContinue={() => dispatch({ type: "PREVIEW_LISTEN_FLOW" })} />
            ) : null}
            {state.mode === "audio" ? (
              <AudioFileInput onContinue={(source) => dispatch({ type: "SUBMIT_AUDIO", source })} />
            ) : null}
            {state.mode === "text" ? (
              <TextInput
                initialText={state.draftText}
                onContinue={(text) => dispatch({ type: "SUBMIT_TEXT", text })}
              />
            ) : null}
          </div>
        </>
      ) : null}

      {state.status === "source_confirmation" ? (
        <SourceConfirmation
          source={state.source}
          onConfirm={() => dispatch({ type: "CONFIRM_SOURCE" })}
          onEdit={() => dispatch({ type: "EDIT_SOURCE" })}
        />
      ) : null}

      {state.status === "learning_preview" ? (
        <LearningPreview
          source={state.source}
          onStartOver={() => dispatch({ type: "START_OVER" })}
        />
      ) : null}
    </div>
  );
}
