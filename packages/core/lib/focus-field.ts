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
    const arrayFieldName = arrayMatch[1]; // e.g., "items"
    const itemIndex = arrayMatch[2]; // e.g., "0"
    const subName = arrayMatch[3]; // e.g., "title"

    const data = state.indexes.nodes[componentId]?.data;
    const componentConfig = appStore.getComponentConfig(data?.type);
    const arrayFieldConfig = componentConfig?.fields?.[arrayFieldName];
    const arrayFieldType = arrayFieldConfig?.type || "array";

    const arrayId = `${componentId}_${arrayFieldType}_${arrayFieldName}`;
    const itemArrayId = `${arrayId}-${itemIndex}`;

    // Expand the array item in the sidebar
    const currentArrayState = state.ui.arrayState[arrayId] || { items: [] };

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

  // Apply all UI updates at once
  appStore.setUi(newUiState);

  // Trigger the scroll
  scrollElementIntoView(fieldId);
};
