import { MouseEvent as ReactMouseEvent } from "react";
import { scrollElementIntoView } from "./auto-scroll";
import { AppStoreApi } from "../store";
import { UiState } from "../types";
import { getSelectorForId } from "./get-selector-for-id";

export const focusAndScrollToField = (
  appStoreApi: AppStoreApi,
  componentId: string,
  propPath: string,
  fieldType: string,
  e?: ReactMouseEvent | MouseEvent
) => {
  // Handle event safely if provided
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  const appStore = appStoreApi.getState();
  const state = appStore.state;
  const itemSelector = getSelectorForId(state, componentId);

  // Prepare a new UI state object to batch component selection and array expansion
  const newUiState: Partial<UiState> = { itemSelector };

  // Check if the propPath points to an array item (e.g., "items[0].title")
  const arrayMatch = propPath.match(/^([^\[]+)\[(\d+)\]\.(.+)$/);

  let fieldId = "";

  if (arrayMatch) {
    const [, arrayFieldName, itemIndex, subName] = arrayMatch;

    const data = state.indexes.nodes[componentId]?.data;
    const componentConfig = appStore.getComponentConfig(data?.type);
    const arrayFieldConfig = componentConfig?.fields?.[arrayFieldName];
    const arrayFieldType = arrayFieldConfig?.type || "array";

    const arrayId = `${componentId}_${arrayFieldType}_${arrayFieldName}`;
    const itemArrayId = `${arrayId}-${itemIndex}`;

    // Safely fallback arrayState using optional chaining
    const currentArrayState = state.ui.arrayState?.[arrayId] || { items: [] };

    newUiState.arrayState = {
      ...state.ui.arrayState,
      [arrayId]: {
        ...currentArrayState,
        openId: itemArrayId,
      },
    };

    // Reconstruct the exact sub-field DOM ID
    fieldId = `${itemArrayId}_${subName}`;
  } else {
    // Standard top-level field format
    fieldId = `${componentId}_${fieldType}_${propPath}`;
  }

  // Commit UI updates at once.
  // This tells the store to update, which tells React to render the new sidebar fields.
  appStore.setUi(newUiState);

  // If the element doesn't exist in the DOM yet, auto-scroll.ts will catch it in pending.
  scrollElementIntoView(fieldId);
};
